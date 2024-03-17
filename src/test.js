export default async function test() {
  let test = [1, 2, 3];
  test.map((value) => console.log(value + 2));
  test = [];
  console.log(test);
}
