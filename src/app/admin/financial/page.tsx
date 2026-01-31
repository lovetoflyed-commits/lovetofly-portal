import { redirect } from 'next/navigation';

export default function FinancialPanelRedirect() {
  redirect('/admin/finance');
}
