export default function Toast({ text, onClose }:{ text:string; onClose:()=>void }) {
  if (!text) return null
  return (
    <div className="fixed left-0 right-0 bottom-20 z-50 flex justify-center">
      <div className="rounded-xl px-3 py-2 text-sm" style={{ background:'rgba(0,0,0,0.7)', color:'#fff' }}>
        {text}
      </div>
      <button className="sr-only" onClick={onClose}>close</button>
    </div>
  )
}


