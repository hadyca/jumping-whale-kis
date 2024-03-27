export default async function test() {
  test2("lalala");
  test2("lelele");
  setTimeout(() => test(), 3000);
}

let testAry = [];

function test2(arg) {
  testAry.push(arg);
  console.log(testAry);
}
