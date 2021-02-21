import { ethers } from 'ethers'
import Numeral from 'numeral'

export const isAddress = (value) => {
    try {
        return ethers.utils.getAddress(value.toLowerCase())
    } catch {
        return false
    }
}

export const toK = (num) => {
    return Numeral(num).format('0.[00]a')
}

export const formatDollarAmount = (num, digits) => {
    const formatter = new Intl.NumberFormat([], {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    return formatter.format(num)
}

export const formattedNum = (number: string, usd = false, acceptNegatives = false) => {
    if (number === '' || number === undefined) {
      return usd ? '$0' : 0
    }
    let num = parseFloat(number)
  
    if (num > 500000000) {
      return (usd ? '$' : '') + toK(num.toFixed(0))
    }
  
    if (num === 0) {
      if (usd) {
        return '$0'
      }
      return 0
    }
  
    if (num < 0.0001 && num > 0) {
      return usd ? '< $0.0001' : '< 0.0001'
    }
  
    if (num > 1000) {
      return usd ? formatDollarAmount(num, 0) : Number(num.toFixed(0)).toLocaleString()
    }
  
    if (usd) {
      if (num < 0.1) {
        return formatDollarAmount(num, 4)
      } else {
        return formatDollarAmount(num, 2)
      }
    }
  
    return Number(num.toFixed(5)).toLocaleString()
  }

export const roundTo = (value: string | number, digits: number = 2): number => {
  if(!value) return 0;
  if(typeof value === "string") value = parseFloat(value);
  const multiplier = Math.pow(10, digits);
  return Math.round(value * multiplier) / multiplier;
}

export const ceilTo = (value: string | number, digits: number = 2): number => {
  if(!value) return 0;
  if(typeof value === "string") value = parseFloat(value);
  const multiplier = Math.pow(10, digits);
  return Math.ceil(value * multiplier) / multiplier;
}

export const floorTo = (value: string | number, digits: number = 2): number => {
  if(!value) return 0;
  if(typeof value === "string") value = parseFloat(value);
  const multiplier = Math.pow(10, digits);
  return Math.floor(value * multiplier) / multiplier;
}