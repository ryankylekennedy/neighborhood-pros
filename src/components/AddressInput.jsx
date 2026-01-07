import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

export function AddressInput({ value, onChange, error, placeholder = 'Enter your street address' }) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        We'll use this to verify you live in the neighborhood
      </p>
    </div>
  )
}
