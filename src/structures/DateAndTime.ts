import { TimeData } from "../typings/interfaces";

export type StringTime = string;

export class DateTime {
    public static getTimeData (datenow: number, minus: number = Date.now()): TimeData {
        let remain = datenow - minus;
      
        let days = Math.floor(remain / (1000 * 60 * 60 * 24))
        remain = remain % (1000 * 60 * 60 * 24)
      
        let hours = Math.floor(remain / (1000 * 60 * 60))
        remain = remain % (1000 * 60 * 60)
      
        let minutes = Math.floor(remain / (1000 * 60))
        remain = remain % (1000 * 60)
      
        let seconds = Math.floor(remain / (1000))
        remain = remain % (1000)
      
        let milliseconds = remain;
      
        return {
          days,
          hours,
          minutes,
          seconds,
          milliseconds
        };
    }
    public static formatTime(timeData: TimeData, useMilli = false): string {
        const o = timeData;
        let parts = []
        if (o.days) {
          let ret = o.days + ' д.'
          if (o.days !== 1) {
          }
          parts.push(ret)
        }
        if (o.hours) {
          let ret = o.hours + ' ч.'
          if (o.hours !== 1) {
          }
          parts.push(ret)
        }
        if (o.minutes) {
          let ret = o.minutes + ' м.'
          if (o.minutes !== 1) {
          }
          parts.push(ret)
      
        }
        if (o.seconds) {
          let ret = o.seconds + ' с.'
          if (o.seconds !== 1) {
          }
          parts.push(ret)
        }
        if (useMilli && o.milliseconds) {
          let ret = o.milliseconds + ' мс.'
          if (o.milliseconds !== 1) {
          }
          parts.push(ret)
        }
        if (parts.length === 0) {
          return 'мгновенно'
        } else {
          return parts.join(' ')
        }
      }

      /**
       * get time string like 
       * @param remain milliseconds 50000 - 50 seconds
       */
      public static toStringWithZero (remain: number): StringTime {
        let hours = (Math.floor(remain / (1000 * 60 * 60))).toString()
        remain = remain % (1000 * 60 * 60)

        let minutes = (Math.floor(remain / (1000 * 60))).toString()
        remain = remain % (1000 * 60)

        let seconds = (Math.floor(remain / (1000))).toString()
        return `${hours.length === 1 ? "0"+hours : hours}:${minutes.length === 1 ? "0"+minutes : minutes}:${seconds.length === 1 ? "0"+seconds : seconds}`
      }
    
} 