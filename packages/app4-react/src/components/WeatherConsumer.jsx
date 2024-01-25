import { useRef } from "react";

const sty = `
:host .consumer {
  border: 1px dashed #f23288;
  border-radius: 10px;
  width: 300px;
  box-sizing: border-box;
  padding: 20px;
}
`;

export default function WeatherConsumer(props) {
  const { city, temperature, onMsg } = props;

  window.abc = "react 111";
  console.log(window.abc);

  const compRef = useRef(null);

  const onCompClick = () => {
    onMsg?.(city);
    compRef.current?.dispatchEvent(
      new CustomEvent("msg", {
        bubbles: true,
        composed: true,
        detail: city,
      })
    );
  };

  return (
    <>
      <style>{sty}</style>
      <div ref={compRef} className="consumer" onClick={onCompClick}>
        <h1 part="title" style={{ color: "#ddd" }}>
          &lt;react-weather-consumer/&gt;
        </h1>
        {city}: {temperature}℃
      </div>
    </>
  );
}
