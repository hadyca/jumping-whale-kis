export default async function test() {
  const userSettingAry = [{ a: 1, b: 2 }];
  for (const obj of userSettingAry) {
    test2(obj);
  }
}

let testAry = [];

function test2(arg) {
  testAry.push(arg);
  console.log(testAry);
}
