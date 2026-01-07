import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export function InviteQRCode({ code, neighborhoodName }) {
  const [copied, setCopied] = useState(false)

  // Generate the invite URL
  const inviteUrl = `${window.location.origin}/invite/${code}`

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-${code}`)
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')

      const downloadLink = document.createElement('a')
      downloadLink.download = `invite-${code}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {neighborhoodName} Invite
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {/* QR Code */}
        <div className="p-6 bg-white rounded-lg">
          <QRCodeSVG
            id={`qr-${code}`}
            value={inviteUrl}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Invite Code */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Invite Code</p>
          <div className="font-mono text-xl font-bold bg-muted px-4 py-2 rounded-lg">
            {code}
          </div>
        </div>

        {/* URL */}
        <div className="w-full">
          <p className="text-sm text-muted-foreground mb-2 text-center">Invite URL</p>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono truncate">
              {inviteUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              className="flex-shrink-0"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleDownloadQR}
          >
            <Download size={18} />
            Download QR Code
          </Button>
        </div>

        {/* Usage Info */}
        <div className="text-xs text-muted-foreground text-center max-w-sm">
          <p>
            Print this QR code on postcards or flyers for your neighborhood mailing.
            Recipients can scan with their phone camera to join.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
