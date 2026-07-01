import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, phone } = data;

    // Validation
    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ message: 'Faltan campos obligatorios' }),
        { status: 400 }
      );
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
      console.warn('BREVO_API_KEY no configurada. Simulando éxito.');
      return new Response(
        JSON.stringify({ message: 'Éxito (Simulado)' }),
        { status: 200 }
      );
    }

    // Brevo API Integration
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          NOMBRE: name,
          WHATSAPP: phone,
          ORIGEN: 'Europa a tu Alcance 2027'
        },
        listIds: [3], // Assuming a new list ID or common lead list
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Brevo:', errorData);
      return new Response(
        JSON.stringify({ message: 'Error al procesar el registro' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Registro exitoso' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en API:', error);
    return new Response(
      JSON.stringify({ message: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
};
