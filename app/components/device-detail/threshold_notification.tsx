import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { type SensorWithLatestMeasurement } from "~/db/schema";

interface SensorAlertDialogProps {
  sensor: SensorWithLatestMeasurement;
}

export default function SensorAlertDialog({ sensor }: SensorAlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [operator, setOperator] = useState<string>("gt");
  const [threshold, setThreshold] = useState<string>("");

  const handleSave = () => {
    console.log({
      sensorId: sensor.id,
      operator,
      threshold: parseFloat(threshold),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        title="Alert einrichten"
      >
        <Bell className="h-4 w-4" />
      </button>
      <DialogContent className="sm:max-w-md dark:bg-zinc-800 dark:text-zinc-200">
        <DialogHeader>
          <DialogTitle>Alert einrichten – {sensor.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-muted-foreground text-sm">
            Benachrichtige mich wenn der Wert:
          </p>
          <div className="flex items-center gap-2">
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-sm bg-transparent"
            >
              <option value="gt">größer als (&gt;)</option>
              <option value="lt">kleiner als (&lt;)</option>
              <option value="eq">gleich (=)</option>
            </select>

            <input
              type="number"
              placeholder="Schwellwert"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-sm bg-transparent w-32"
            />

            <span className="text-muted-foreground text-sm">{sensor.unit}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!threshold}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
