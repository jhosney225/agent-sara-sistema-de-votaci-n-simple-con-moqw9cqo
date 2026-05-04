
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

// Data structure to store votes
let votes = {
  option_a: 0,
  option_b: 0,
  option_c: 0,
  option_d: 0,
};

let conversationHistory = [];

// Function to update votes based on user choice
function recordVote(choice) {
  const lowerChoice = choice.toLowerCase();
  if (lowerChoice === "a" && votes.option_a !== undefined) {
    votes.option_a++;
    return "Voto registrado para Opción A";
  } else if (lowerChoice === "b" && votes.option_b !== undefined) {
    votes.option_b++;
    return "Voto registrado para Opción B";
  } else if (lowerChoice === "c" && votes.option_c !== undefined) {
    votes.option_c++;
    return "Voto registrado para Opción C";
  } else if (lowerChoice === "d" && votes.option_d !== undefined) {
    votes.option_d++;
    return "Voto registrado para Opción D";
  }
  return "Opción inválida. Por favor elige A, B, C o D.";
}

// Function to get voting results
function getResults() {
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return "No hay votos registrados aún.";
  }

  let results = `Resultados de votación (Total: ${total} votos):\n`;
  results += `Opción A: ${votes.option_a} votos (${((votes.option_a / total) * 100).toFixed(1)}%)\n`;
  results += `Opción B: ${votes.option_b} votos (${((votes.option_b / total) * 100).toFixed(1)}%)\n`;
  results += `Opción C: ${votes.option_c} votos (${((votes.option_c / total) * 100).toFixed(1)}%)\n`;
  results += `Opción D: ${votes.option_d} votos (${((votes.option_d / total) * 100).toFixed(1)}%)`;

  return results;
}

// Function to process user input and interact with Claude
async function processUserInput(userMessage) {
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Create a system message that explains the voting system context
  const systemMessage = `Eres un asistente de votación amigable. Tienes acceso a un sistema de votación simple.
El usuario puede:
1. Votar por una opción (A, B, C o D)
2. Ver los resultados actuales
3. Hacer preguntas sobre el sistema de votación

Cuando el usuario quiera votar, extrae su opción elegida y responde de manera amigable.
Cuando pida ver resultados, muestra un resumen amigable de los votos actuales.

${getResults()}

Sé conciso pero amigable en tus respuestas.`;

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: systemMessage,
    messages: conversationHistory,
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";

  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  // Check if user is trying to vote
  if (
    userMessage.toLowerCase().includes("vot") ||
    userMessage.toLowerCase().includes("a") ||
    userMessage.toLowerCase().includes("b") ||
    userMessage.toLowerCase().includes("c") ||
    userMessage.toLowerCase().includes("d")
  ) {
    // Extract the choice (looking for single letters)
    const choiceMatch = userMessage.match(/[abcdABCD]/);
    if (choiceMatch) {
      const voteResult = recordVote(choiceMatch[0]);
      return `${assistantMessage}\n[Sistema: ${voteResult}]`;
    }
  }

  // Check if user is asking for results
  if (
    userMessage.toLowerCase().includes("resultado") ||
    userMessage.toLowerCase().includes("resultado") ||
    userMessage.toLowerCase().includes("cuántos")
  ) {
    return `${assistantMessage}\n\n[Resultados actuales]\n${getResults()}`;
  }

  return assistantMessage;
}

// Main function to run the voting system
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🗳️  Sistema de Votación Interactivo");
  console.log("====================================");
  console.log(
    "Bienvenido al sistema de votación. Puedes votar por las opciones A, B, C o D."
  );
  console.log("Escribe 'resultados' para ver los resultados actuales.");
  console.log("Escribe 'salir' para terminar.\n");

  // Initial greeting from Claude
  const greeting = await processUserInput(
    "Hola, me gustaría participar en la votación. ¿Cuál es la pregunta que estamos votando?"
  );
  console.log(`Asistente: ${greeting}\n`);

  // Function to prompt user for input
  const askQuestion = () => {
    rl.question("Tú: ", async (input) => {
      if (input.toLowerCase() === "salir") {
        console.log(
          "\n📊 Votación finalizada. Resultados finales:\n" + getResults()
        );
        rl.close