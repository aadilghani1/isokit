import { type KeyboardEvent, type ReactNode, type SVGProps, useState } from "react"
import { classNames } from "../class-names"
import { playSound } from "../sound/sound-player"

export type PressProps = {
  label: string
  onPress: () => void
  sound?: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
} & Omit<SVGProps<SVGGElement>, "onClick" | "onKeyDown" | "onKeyUp" | "children" | "className">

const isActivationKey = (event: KeyboardEvent): boolean => event.key === "Enter" || event.key === " "

export function Press({ label, onPress, sound = true, disabled, className, children, onBlur, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, ...rest }: PressProps): ReactNode {
  const [down, setDown] = useState(false)
  const pushDown = () => {
    if (disabled) return
    setDown(true)
    if (sound) playSound("press")
  }
  const letUp = () => {
    setDown(false)
    if (sound) playSound("release")
  }
  return (
    <g
      className={classNames("ik-press", className)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      data-down={down}
      onPointerDown={(event) => {
        if (event.button === 0) pushDown()
        onPointerDown?.(event)
      }}
      onPointerUp={(event) => {
        if (down) letUp()
        onPointerUp?.(event)
      }}
      onPointerLeave={(event) => {
        setDown(false)
        onPointerLeave?.(event)
      }}
      onPointerCancel={(event) => {
        setDown(false)
        onPointerCancel?.(event)
      }}
      onBlur={(event) => {
        setDown(false)
        onBlur?.(event)
      }}
      onClick={() => {
        if (!disabled) onPress()
      }}
      onKeyDown={(event) => {
        if (!isActivationKey(event)) return
        event.preventDefault()
        if (!event.repeat) pushDown()
      }}
      onKeyUp={(event) => {
        if (!isActivationKey(event) || !down) return
        event.preventDefault()
        letUp()
        if (!disabled) onPress()
      }}
      {...rest}
    >
      {children}
    </g>
  )
}
