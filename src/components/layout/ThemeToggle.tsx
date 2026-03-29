import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ThemeToggle({ iconOnly = false }: { iconOnly?: boolean }) {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  const button = (
    <Button
      variant="ghost"
      size={iconOnly ? 'icon' : 'sm'}
      className={iconOnly ? 'h-8 w-8' : 'h-8 w-full justify-start gap-2'}
      onClick={toggleTheme}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 shrink-0" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" />
      )}
      {!iconOnly && (
        <span className="text-xs">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      )}
    </Button>
  )

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          Toggle {theme === 'dark' ? 'light' : 'dark'} mode
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
