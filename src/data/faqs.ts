export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Quando devo procurar um advogado criminalista?',
    answer: 'O ideal é buscar orientação assim que houver conhecimento de investigação, intimação, bloqueio de bens ou qualquer risco criminal. A atuação antecipada amplia as possibilidades estratégicas.',
  },
  {
    question: 'O atendimento é sigiloso?',
    answer: 'Sim. Todas as conversas, documentos e informações são tratados sob sigilo profissional absoluto, desde o primeiro contato.',
  },
  {
    question: 'O escritório atende fora de São Paulo?',
    answer: 'Sim. A atuação pode ocorrer em todo o Brasil, com acompanhamento presencial ou remoto conforme a necessidade do caso.',
  },
  {
    question: 'Como funciona o primeiro diagnóstico?',
    answer: 'O primeiro contato serve para entender o contexto, identificar urgências e definir os próximos passos. Casos sensíveis recebem retorno prioritário.',
  },
];
