// const button = document.getElementById("sendBtn");

// button.addEventListener("click", async () => {

//     const message = document.getElementById("message").value;
//     const response = await fetch("/chat",{

//         method:"POST",
//         headers:{
//             "Content-Type":"application/json"
//         },

//         body:JSON.stringify({
//             message
//         })

//     });

//     const data = await response.json();

//     document.getElementById("reply").innerText =
//     data.reply;

// });


const button = document.getElementById("sendBtn");

button.addEventListener("click", async () => {
  const messageInput = document.getElementById("message");
  const reply = document.getElementById("reply");

  const message = messageInput.value.trim();

  if (!message) {
    reply.innerText = "Please enter a message.";
    return;
  }

  reply.innerText = "Thinking...";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
    });

    const data = await response.json();

    console.log("Server response:", data);

    if (data.success) {
      reply.innerText = data.reply;
    } else {
      reply.innerText = "Error: " + data.error;
    }

  } catch (error) {
    console.error("Frontend error:", error);

    reply.innerText = "Unable to connect to the server.";
  }
});