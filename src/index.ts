import client from "./structures/Client";

client.on("ready", () => {
    console.log(`${client.user.username} is ready!`);
});

client.on('error',function(err){});

process.on('unhandledRejection', error => {
  console.log('Test error:', error);
});

client.login();
