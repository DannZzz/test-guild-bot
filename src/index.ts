import client from "./structures/Client";

client.on("ready", () => {
    console.log(`${client.user.username} — ready!`);
});

client.on('error',function(err){});

process.on('unhandledRejection', error => {
  console.log('Test error:', error);
});

client.login();
