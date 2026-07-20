export const CONTRIBUTION_PROMPTS = [
  {
    id: 'daily_life',
    title: 'Saludos y vida cotidiana',
    prompt: 'Comparte algo que dirías al recibir una visita, despedirte, agradecer o conversar en casa.',
  },
  {
    id: 'expressions',
    title: 'Dichos y expresiones populares',
    prompt: 'Comparte una expresión que uses en tu familia o comunidad y explica cuándo se utiliza.',
  },
  {
    id: 'memories',
    title: 'Historias y recuerdos',
    prompt: 'Cuenta brevemente, con tus propias palabras, una historia, enseñanza o recuerdo familiar.',
  },
  {
    id: 'nature',
    title: 'Naturaleza y territorio',
    prompt: 'Habla sobre una planta, animal, lugar, clima o temporada importante para tu comunidad.',
  },
  {
    id: 'traditions',
    title: 'Comida, oficios y tradiciones',
    prompt: 'Explica cómo se prepara algo, cómo se realiza un trabajo o cómo se vive una costumbre.',
  },
] as const;

export type ContributionPrompt = (typeof CONTRIBUTION_PROMPTS)[number];
export type ContributionPromptId = ContributionPrompt['id'];

export function getNextContributionPrompt(
  currentId?: ContributionPromptId,
  random: () => number = Math.random,
): ContributionPrompt {
  const choices = currentId
    ? CONTRIBUTION_PROMPTS.filter((prompt) => prompt.id !== currentId)
    : CONTRIBUTION_PROMPTS;
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return choices[index];
}
