/**
 * Aba vazia aberta no clique, para receber o endereço depois que o banco
 * responder (aberta mais tarde, o navegador entende como popup e bloqueia).
 *
 * Não dá para usar `noopener` aqui: com ele o `window.open` sempre devolve
 * `null`, mesmo abrindo a aba. O código achava que o popup tinha sido
 * bloqueado, levava a página do cliente para o WhatsApp e largava uma aba em
 * branco para trás. Cortar o `opener` à mão protege do mesmo jeito e mantém a
 * referência para preencher a aba.
 */
export const openBlankTab = (): Window | null => {
  const tab = window.open('', '_blank')
  if (tab) tab.opener = null
  return tab
}
