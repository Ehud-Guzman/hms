// frontend/src/modules/pharmacy/utils.js
export function formatNumberWithCommas(x) {
  if (x == null) return '0'
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
