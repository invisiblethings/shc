// Web MIDI input: note on/off and the sustain pedal (CC 64).

/** Returns { stop, names } or null when MIDI is unavailable or refused. */
export async function connectMidi({ onNoteOn, onNoteOff, onSustain, onDevices }) {
  if (!navigator.requestMIDIAccess) return null;
  let access;
  try {
    access = await navigator.requestMIDIAccess();
  } catch {
    return null;
  }

  const handle = ({ data }) => {
    const [status, a, b] = data;
    const type = status & 0xf0;
    if (type === 0x90 && b > 0) onNoteOn(a, b / 127);
    else if (type === 0x80 || (type === 0x90 && b === 0)) onNoteOff(a);
    else if (type === 0xb0 && a === 64) onSustain(b >= 64);
  };

  const refresh = () => {
    const names = [];
    for (const input of access.inputs.values()) {
      input.onmidimessage = handle;
      names.push(input.name);
    }
    onDevices(names);
  };
  access.onstatechange = refresh;
  refresh();

  return {
    stop() {
      access.onstatechange = null;
      for (const input of access.inputs.values()) input.onmidimessage = null;
    },
  };
}
