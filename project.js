const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://test.mosquitto.org");

client.on("connect", () => {
  client.subscribe("test/topic", (err) => {
    if (!err) {
      console.log("토픽 구독 성공");
    } else {
      console.log("구독실패",err);
    }
  });
});

client.on("message", (topic, message) => {
  const msg = message.toString()
  console.log(`받은 메시지 [${topic}]:${msg}`);


const noise = Number(msg); //숫자로 형태 바꿈

if (isNaN(noise)){
  console.log("숫자가 아닌 데이터");
  return;
}

let congestion = "";

if (noise < 40 ){
  congestion = "Low";
} else if (noise < 70){
  congestion = "Mid";
} else {
  congestion = "High";
}

console.log(`소음:${noise} dB / 혼잡도 : ${congestion}`);
});