import { useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { Pencil, X } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface DrawControlProps {
  onPolygonComplete: (polygon: GeoJSON.Feature) => void
}

export default function DrawControl({ onPolygonComplete }: DrawControlProps) {
  const { current: map } = useMap()
  const drawRef = useRef<TerraDraw | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const handleStartDrawing = () => {
    if (!map) return

    if (!drawRef.current) {
      const mapInstance = map.getMap()

      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map: mapInstance }),
        modes: [
          new TerraDrawPolygonMode(),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: false,
                },
              },
            },
          }),
        ],
      })

      draw.on('finish', (id) => {
        const snapshot = draw.getSnapshot()
        const feature = snapshot.find((f) => f.id === id)
        if (feature) {
          onPolygonComplete(feature as GeoJSON.Feature)
          draw.setMode('select')
          setIsDrawing(false)
        }
      })

      drawRef.current = draw
    }

    drawRef.current.start()
    drawRef.current.setMode('polygon')
    setIsDrawing(true)
  }

  const handleCancel = () => {
    if (!drawRef.current) return
    drawRef.current.clear()
    drawRef.current.stop()
    setIsDrawing(false)
  }

  return (
    <div className="absolute bottom-24 right-2.5 z-10 flex flex-col gap-2">
      {!isDrawing ? (
        <Button
          variant="outline"
          size="icon"
          onClick={handleStartDrawing}
          className="bg-white dark:bg-zinc-800 shadow-md"
          title="Draw area"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={handleCancel}
          className="bg-white dark:bg-zinc-800 shadow-md"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}