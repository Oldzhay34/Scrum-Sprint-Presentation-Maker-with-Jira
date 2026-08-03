import { useState } from "react";

function newBar() {
  return { label: "", segments: [{ value: "", color: "green" }, { value: "", color: "blue" }] };
}

export function useBandEditor() {
  const [show, setShow] = useState(false);
  const [bars, setBars] = useState([]);

  const toggleShow = (checked) => {
    setShow(checked);
    if (checked && bars.length === 0) setBars([newBar()]);
  };

  const addBar = () => setBars((prev) => [...prev, newBar()]);
  const removeBar = (index) => setBars((prev) => prev.filter((_, i) => i !== index));
  const updateBarLabel = (index, label) =>
    setBars((prev) => prev.map((b, i) => (i === index ? { ...b, label } : b)));

  const addSegment = (barIndex) =>
    setBars((prev) =>
      prev.map((b, i) => (i === barIndex ? { ...b, segments: [...b.segments, { value: "", color: "blue" }] } : b))
    );
  const removeSegment = (barIndex, segIndex) =>
    setBars((prev) =>
      prev.map((b, i) => (i === barIndex ? { ...b, segments: b.segments.filter((_, si) => si !== segIndex) } : b))
    );
  const updateSegment = (barIndex, segIndex, patch) =>
    setBars((prev) =>
      prev.map((b, i) =>
        i === barIndex
          ? { ...b, segments: b.segments.map((s, si) => (si === segIndex ? { ...s, ...patch } : s)) }
          : b
      )
    );

  const setSample = (sampleBars) => {
    setShow(true);
    setBars(sampleBars);
  };

  return { show, bars, toggleShow, addBar, removeBar, updateBarLabel, addSegment, removeSegment, updateSegment, setSample };
}
