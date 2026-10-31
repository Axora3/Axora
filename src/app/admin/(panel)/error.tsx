"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6" role="alert">
    <h1 className="text-2xl font-extrabold">Хуудсыг ачаалж чадсангүй</h1>
    <p className="text-muted">Холболтоо шалгаад дахин оролдоно уу. Хадгалалт тасарсан бол дахин илгээхээс өмнө мэдээллээ шинэчилж шалгана уу.</p>
    <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-primary px-4 font-bold text-on-primary">Дахин оролдох</button>
    <a href="/admin" className="min-h-11 text-center font-bold">Хяналтын самбар руу буцах</a>
  </main>;
}
