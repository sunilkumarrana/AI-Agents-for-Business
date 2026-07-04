const userMessage = "i'm sunil";
const q = userMessage.toLowerCase().trim().replace(/[^\w\s]/g, ' ');
console.log("q is:", q);
const introMatch = q.match(/^(i m|im|i am|my name is)\s+(\w+)/i);
console.log("introMatch:", introMatch);
