exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { dados } = JSON.parse(event.body);

    const prompt = `Você é um consultor especialista em visagismo masculino. Com base nas respostas da pré-avaliação abaixo, gere um diagnóstico inicial personalizado.

DADOS DO CLIENTE:
- Nome: ${dados.nome}, ${dados.idade} anos
- Profissão: ${dados.profissao}
- Rotina/contexto: ${dados.rotina}
- Imagem que deseja transmitir: ${dados.imagem}
- Principal insatisfação: ${dados.insatisfacao}
- Referência visual: ${dados.referencia}
- Limitações: ${dados.limitacao}

Responda APENAS com JSON válido, sem markdown, sem texto adicional:
{
  "perfil": "2-3 frases sobre o perfil visual atual",
  "foco_consultoria": "2-3 frases sobre o que a consultoria vai priorizar",
  "oportunidades": "2-3 frases sobre os principais pontos de melhoria",
  "alertas": "1-2 frases sobre limitações a considerar. Se nenhuma: Nenhum alerta identificado.",
  "proximos_passos": "2-3 frases orientando os próximos passos"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erro API Claude:', result);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro na API Claude', detail: result })
      };
    }

    const raw = result.content.map(b => b.text || '').join('');
    const diagnostico = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnostico })
    };

  } catch (err) {
    console.error('Erro na function:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
