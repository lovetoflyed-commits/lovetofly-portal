import { NextResponse } from 'next/server';
import { loginUser } from '@/controllers/userController'; // Importa a função loginUser
import { serialize } from 'cookie'; // <<< ADICIONADO: Importação para serializar cookies

export async function POST(request: Request) {
  try {
    // Chama a função loginUser do seu controller
    const loginResponse = await loginUser(request);

    // Se o loginUser retornou um erro (status diferente de 200)
    if (loginResponse.status !== 200) {
      return loginResponse; // Retorna o erro diretamente
    }

    // Se o login foi bem-sucedido, extrai o token e os dados do usuário
    const data = await loginResponse.json();
    const { token, user } = data;

    // Configura o cookie de sessão
    const serializedCookie = serialize('auth_token', token, {
      httpOnly: true, // O cookie não pode ser acessado via JavaScript no navegador
      secure: process.env.NODE_ENV === 'production', // true em produção (HTTPS), false em desenvolvimento (HTTP)
      maxAge: 60 * 60, // 1 hora (em segundos)
      path: '/', // O cookie é válido para todo o site
      sameSite: 'lax', // Proteção contra CSRF
    });

    // Retorna a resposta com o cookie configurado
    const response = NextResponse.json(
      {
        message: 'Login realizado com sucesso!',
        token, // Include token in response
        user: {
          id: user.id,
          name: user.firstName, // Use firstName
          email: user.email,
          // Removido anac_code, plan, etc., pois não estão no DB ou no retorno de loginUser
        },
      },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', serializedCookie);
    return response;

  } catch (error: any) {
    console.error('Erro no login do endpoint:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
