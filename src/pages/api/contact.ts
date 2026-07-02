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

    const BREVO_API_KEY = import.meta.env.BREVO_API_KEY || process.env.BREVO_API_KEY;

    if (!BREVO_API_KEY) {
      console.warn('BREVO_API_KEY no detectada en import.meta.env ni process.env');
      return new Response(
        JSON.stringify({ message: 'Éxito (Simulado - Falta API Key)' }),
        { status: 200 }
      );
    }

    // Normalize phone for Brevo (WhatsApp/SMS attributes require + and country code)
    let normalizedPhone = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (!normalizedPhone.startsWith('+')) {
      // Default to +52 (Mexico) if no country code provided, 
      // as the context is MXN currency.
      normalizedPhone = `+52${normalizedPhone}`;
    }

    // 1. Add Contact to Brevo
    const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
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
          WHATSAPP: normalizedPhone,
          ORIGEN: 'Europa a tu Alcance 2027'
        },
        listIds: [3],
        updateEnabled: true,
      }),
    });

    // 2. Send Transactional Email to Agency
    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: "VCY Europa Landing", email: "noreply@futurite.info" },
        to: [{ email: "dev@futurite.com", name: "Dev Futurite" }],
        subject: "Nuevo Lead: Europa a tu Alcance 2027",
        htmlContent: `
          <h1>Nuevo interesado en Europa 2027</h1>
          <p>Se ha registrado un nuevo lead desde la landing page:</p>
          <ul>
            <li><strong>Nombre:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Teléfono/WhatsApp:</strong> ${normalizedPhone}</li>
            <li><strong>Origen:</strong> Europa a tu Alcance 2027</li>
          </ul>
        `
      }),
    });

    if (!contactResponse.ok) {
      const contactError = await contactResponse.json();
      console.error('Error Brevo (Contacts):', contactError);
    }

    if (!emailResponse.ok) {
      const emailError = await emailResponse.json();
      console.error('Error Brevo (SMTP):', emailError);
    }

    if (!contactResponse.ok || !emailResponse.ok) {
      return new Response(
        JSON.stringify({ message: 'Error en la integración con Brevo' }),
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
