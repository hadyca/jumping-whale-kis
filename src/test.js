export default async function test() {
  let test = false;
  if (true) {
    setTimeout(() => (test = true), 1000);
  }
  if (test) {
    console.log("실행되나");
  }
}
