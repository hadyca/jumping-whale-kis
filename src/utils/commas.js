export default function convertComma(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
