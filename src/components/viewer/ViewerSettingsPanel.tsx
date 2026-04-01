'use client'

import { useAppStore } from '@/store'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const BG_PRESETS = [
  '#222222', '#000000', '#ffffff', '#1a1a2e', '#2d3436', '#dfe6e9',
]

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        {title}
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-3 pb-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
          {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch size="sm" checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function ViewerSettingsPanel({
  onResetCamera,
}: {
  onResetCamera?: () => void
}) {
  const settings = useAppStore((s) => s.viewerSettings)
  const set = useAppStore((s) => s.setViewerSettings)
  const reset = useAppStore((s) => s.resetViewerSettings)

  return (
    <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
      {/* Scene */}
      <Section title="Scene">
        <div className="space-y-1.5">
          <Label className="text-xs">Background</Label>
          <div className="flex items-center gap-1.5">
            {BG_PRESETS.map((color) => (
              <button
                key={color}
                className={cn(
                  'h-5 w-5 rounded-sm border border-border transition-all',
                  settings.backgroundColor === color &&
                    'ring-1 ring-primary ring-offset-1 ring-offset-background'
                )}
                style={{ backgroundColor: color }}
                onClick={() => set({ backgroundColor: color })}
              />
            ))}
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => set({ backgroundColor: e.target.value })}
              className="h-5 w-5 cursor-pointer rounded-sm border border-border bg-transparent p-0"
            />
          </div>
        </div>
        <SwitchRow
          label="Grid"
          checked={settings.gridVisible}
          onChange={(v) => set({ gridVisible: v })}
        />
      </Section>

      <Separator />

      {/* Lighting */}
      <Section title="Lighting">
        <SliderRow
          label="Ambient"
          value={settings.ambientIntensity}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => set({ ambientIntensity: v })}
        />
        <SliderRow
          label="Directional"
          value={settings.directionalIntensity}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => set({ directionalIntensity: v })}
        />
        <SliderRow
          label="Exposure"
          value={settings.exposure}
          min={0}
          max={3}
          step={0.05}
          onChange={(v) => set({ exposure: v })}
        />
      </Section>

      <Separator />

      {/* Camera */}
      <Section title="Camera">
        <SwitchRow
          label="Auto-rotate"
          checked={settings.autoRotate}
          onChange={(v) => set({ autoRotate: v })}
        />
        <SliderRow
          label="Field of view"
          value={settings.fov}
          min={20}
          max={90}
          step={1}
          onChange={(v) => set({ fov: v })}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={onResetCamera}
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reset Camera
        </Button>
      </Section>

      <Separator />

      {/* Material */}
      <Section title="Material">
        <SwitchRow
          label="Wireframe"
          checked={settings.wireframe}
          onChange={(v) => set({ wireframe: v })}
        />
        <SliderRow
          label="Opacity"
          value={settings.opacity}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => set({ opacity: v })}
        />
        <SwitchRow
          label="Double-sided"
          checked={settings.doubleSided}
          onChange={(v) => set({ doubleSided: v })}
        />
      </Section>

      <Separator />

      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-xs text-muted-foreground"
        onClick={reset}
      >
        Reset All
      </Button>
    </div>
  )
}
