export default async function test() {
  if (true) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log("첫번째");
  }
  console.log("두번째");
}
