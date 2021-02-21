import BigNumber from "bignumber.js";

export const toWeiWithDecimals = (value: string, decimals: number = 18) => {
  const formattedValue = new BigNumber(value);
  const divisor = new BigNumber(10).pow(new BigNumber(decimals));
  return formattedValue.multipliedBy(divisor).integerValue().toFixed();
}

export const fromWeiWithDecimals = (value: string, decimals: number = 18) => {
  let formattedValue = new BigNumber(value);
  const divisor = new BigNumber(10).pow(new BigNumber(decimals));
  return formattedValue.dividedBy(divisor).toString();
}

export const toBigN = (a: string) => {
  return new BigNumber(a);
}