const path = require('path');
const Stripe = require('stripe');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

async function run() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY not set');
  }

  const stripe = new Stripe(stripeKey);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: plans } = await client.query(
    `SELECT id, code, name, description, monthly_price, annual_price,
            stripe_product_id, stripe_monthly_price_id, stripe_annual_price_id
     FROM membership_plans
     ORDER BY id`
  );

  for (const plan of plans) {
    if (plan.code === 'free') {
      console.log(`Skipping free plan (${plan.code})`);
      continue;
    }

    const needsMonthly = !plan.stripe_monthly_price_id;
    const needsAnnual = !plan.stripe_annual_price_id;
    if (!needsMonthly && !needsAnnual) {
      console.log(`Using existing Stripe prices for ${plan.code}`);
      continue;
    }

    const product = await stripe.products.create({
      name: `Love to Fly - ${plan.name}`,
      description: plan.description || undefined,
      metadata: { plan_code: plan.code },
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(Number(plan.monthly_price) * 100),
      currency: 'brl',
      recurring: { interval: 'month', interval_count: 1 },
    });

    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(Number(plan.annual_price) * 100),
      currency: 'brl',
      recurring: { interval: 'year', interval_count: 1 },
    });

    await client.query(
      `UPDATE membership_plans
       SET stripe_product_id = $1,
           stripe_monthly_price_id = $2,
           stripe_annual_price_id = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [product.id, monthlyPrice.id, annualPrice.id, plan.id]
    );

    console.log(`Updated ${plan.code}: monthly=${monthlyPrice.id} annual=${annualPrice.id}`);
  }

  await client.end();
}

run().catch((error) => {
  console.error('Stripe backfill failed:', error);
  process.exit(1);
});
