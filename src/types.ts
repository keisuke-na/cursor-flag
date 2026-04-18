export interface Rule {
  pattern: string
  text: string
  color?: string
  blink: boolean
  heartbeat: boolean
  errorCounter: boolean
}