"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const pollutionTypes = ["Eau trouble", "Sol décoloré", "Poissons morts", "Récolte abîmée", "Autre"] as const;

function ArrowUpRight() {
  return <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none"><path d="M3 13 13 3M5 3h8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PinIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.7" /></svg>;
}

function UploadIcon() {
  return <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function StepIcon({ type }: { type: "pin" | "scan" | "shield" }) {
  const paths = {
    pin: <><path d="M19 10c0 4.5-7 9-7 9s-7-4.5-7-9a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><circle cx="12" cy="12" r="3" /></>,
    shield: <><path d="m12 3 7 3v5c0 4.5-3 7.8-7 10-4-2.2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  };
  return <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [typePollution, setTypePollution] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("La géolocalisation n’est pas disponible.");
      return;
    }
    setLocationStatus("Recherche de votre position...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(String(coords.latitude));
        setLongitude(String(coords.longitude));
        setLocationStatus("Position enregistrée.");
      },
      () => setLocationStatus("Impossible d’obtenir votre position."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!typePollution) {
      setFormStatus("Veuillez sélectionner un type de pollution.");
      return;
    }
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setFormStatus("");
    try {
      const photoFiles = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
      const photoUrls = await Promise.all(photoFiles.map(async (file) => {
        const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("signalements").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("signalements").getPublicUrl(filePath);
        return data.publicUrl;
      }));
      const response = await fetch("/api/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_pollution: typePollution,
          description: formData.get("description"),
          nom_zone: formData.get("nom_zone"),
          contact_signaleur: formData.get("contact_signaleur"),
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          photo_urls: photoUrls,
        }),
      });
      if (!response.ok) throw new Error("Report submission failed");
      formRef.current?.reset();
      setTypePollution("");
      setLatitude("");
      setLongitude("");
      setFormStatus("Votre signalement a bien été envoyé.");
    } catch {
      setFormStatus("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07110d] text-[#e8f2e9]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <a href="#" className="flex items-center gap-2.5 text-sm font-semibold tracking-wide"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400 text-[#07110d]">✦</span> AgriAlerte</a>
        <div className="hidden items-center gap-8 text-sm text-emerald-100/60 md:flex"><a href="#fonctionnement" className="transition hover:text-white">Comment ça marche</a><a href="#mission" className="transition hover:text-white">Notre mission</a></div>
        <a href="#signalement" className="rounded-full border border-emerald-300/30 px-4 py-2 text-xs font-semibold transition hover:border-emerald-300 hover:bg-emerald-300/10">Faire un signalement <span className="ml-1">↗</span></a>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-32 lg:pt-20">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300"><span className="h-px w-8 bg-emerald-400" /> Côte d’Ivoire · Alerte citoyenne</p>
          <h1 className="max-w-3xl text-5xl font-medium leading-[1.03] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">Protégeons les terres qui <span className="text-emerald-300">nous nourrissent.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-emerald-100/60 sm:text-lg">L’orpaillage clandestin détruit nos rivières et nos cultures. AgriAlerte transforme chaque observation en action : <strong className="font-medium text-emerald-100">Signalement citoyen → Analyse satellite → Intervention.</strong></p>
          <a href="#signalement" className="mt-9 inline-flex items-center gap-3 rounded-full bg-emerald-300 px-6 py-3.5 text-sm font-bold text-[#07110d] transition hover:-translate-y-0.5 hover:bg-emerald-200">Signaler une pollution <ArrowUpRight /></a>
          <div className="mt-14 flex gap-10 border-t border-white/10 pt-6"><div><p className="text-2xl font-medium text-white">24h</p><p className="mt-1 text-xs text-emerald-100/45">pour analyser une alerte</p></div><div><p className="text-2xl font-medium text-white">100%</p><p className="mt-1 text-xs text-emerald-100/45">données vérifiées</p></div></div>
        </div>
        <div className="relative h-[440px] overflow-hidden rounded-[2rem] border border-white/10 bg-emerald-950/30 shadow-2xl shadow-black/30 lg:h-[560px]">
          <Image src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85" alt="Paysage agricole verdoyant de Côte d'Ivoire" fill priority className="object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07110d] via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-[#10251b]/70 p-4 backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-widest text-emerald-300">Zone surveillée</p><p className="mt-1 text-sm font-medium text-white">Bassin de la Comoé</p></div><span className="flex items-center gap-1.5 text-xs text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> En ligne</span></div></div>
        </div>
      </section>

      <section id="fonctionnement" className="border-y border-white/10 bg-[#0a1811] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl"><div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Le processus</p><h2 className="mt-3 text-3xl tracking-tight text-white sm:text-4xl">Une alerte. Un impact concret.</h2></div><p className="max-w-xs text-sm leading-6 text-emerald-100/50">De votre téléphone jusqu’aux équipes sur le terrain, chaque signalement compte.</p></div>
          <div className="grid gap-4 md:grid-cols-3">{[["01", "pin", "Signalement citoyen", "Décrivez ce que vous observez et partagez la position exacte de la zone touchée."], ["02", "scan", "Analyse IA par satellite", "Nos outils croisent votre alerte avec les images satellite pour confirmer l’impact."], ["03", "shield", "Intervention des autorités", "Les services compétents reçoivent une alerte qualifiée et peuvent agir rapidement."]].map(([number, icon, title, text]) => <article key={number} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/40 hover:bg-emerald-300/[0.06]"><div className="flex items-center justify-between text-emerald-300"><StepIcon type={icon as "pin" | "scan" | "shield"} /><span className="font-mono text-xs text-emerald-100/35">{number}</span></div><h3 className="mt-12 text-lg font-medium text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-emerald-100/50">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="mission" className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-32"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Notre mission</p><h2 className="mt-4 max-w-lg text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl">La technologie au service de la <span className="text-emerald-300">terre.</span></h2></div><div className="max-w-xl text-base leading-8 text-emerald-100/60"><p>AgriAlerte est née d’une conviction simple : les communautés qui vivent de la terre doivent avoir les moyens de la défendre.</p><p className="mt-5">Nous réunissons la vigilance citoyenne, l’intelligence artificielle et l’action publique pour préserver les cours d’eau, les forêts et l’agriculture ivoirienne.</p></div></section>

      <section id="signalement" className="relative mx-5 mb-10 overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-[#10251b] sm:mx-8 lg:mx-auto lg:max-w-7xl"><div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" /><div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[.75fr_1.25fr] lg:p-14"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Votre voix compte</p><h2 className="mt-4 text-3xl tracking-tight text-white sm:text-4xl">Signaler une pollution</h2><p className="mt-4 max-w-sm text-sm leading-6 text-emerald-100/55">Chaque détail aide nos équipes à comprendre et protéger votre environnement.</p><button type="button" onClick={useCurrentLocation} className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 px-4 py-2.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-300/10"><PinIcon /> Utiliser ma position actuelle</button>{locationStatus && <p className="mt-3 text-xs text-emerald-300" role="status">{locationStatus}</p>}</div>
          <form ref={formRef} onSubmit={submitReport} className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="nom_zone">Nom du lieu / village</label><input id="nom_zone" name="nom_zone" type="text" required placeholder="Ex. Abengourou" /></div><div><label htmlFor="contact_signaleur">Téléphone <span>(optionnel)</span></label><input id="contact_signaleur" name="contact_signaleur" type="tel" placeholder="+225 ..." /></div><fieldset className="sm:col-span-2"><legend>Type de pollution</legend><div className="mt-2 flex flex-wrap gap-2">{pollutionTypes.map((type) => <button key={type} type="button" aria-pressed={typePollution === type} onClick={() => setTypePollution(type)} className={`rounded-full border px-3.5 py-2 text-xs transition ${typePollution === type ? "border-emerald-300 bg-emerald-300 text-[#07110d]" : "border-white/15 text-emerald-100/65 hover:border-emerald-300/60"}`}>{type}</button>)}</div></fieldset><div className="sm:col-span-2"><label htmlFor="description">Description des faits</label><textarea id="description" name="description" required rows={4} placeholder="Décrivez ce que vous avez observé..." /></div><div className="sm:col-span-2"><label htmlFor="photos">Photos <span>(optionnel)</span></label><label htmlFor="photos" className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/10 px-4 py-4 text-sm text-emerald-100/50 transition hover:border-emerald-300/60"><UploadIcon /> Ajouter des photos <input id="photos" name="photos" type="file" accept="image/*" multiple className="sr-only" /></label></div><input type="hidden" name="latitude" value={latitude} readOnly /><input type="hidden" name="longitude" value={longitude} readOnly /><button type="submit" disabled={isSubmitting} className="sm:col-span-2 rounded-full bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#07110d] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Envoi en cours..." : "Envoyer le signalement  ↗"}</button>{formStatus && <p className="sm:col-span-2 text-center text-sm text-emerald-300" role="status">{formStatus}</p>}</form>
        </div></section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-emerald-100/35 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>© 2024 AgriAlerte</span><span>Pour une Côte d’Ivoire fertile et durable.</span></footer>
      <style jsx global>{`label, legend { display:block; font-size: .75rem; font-weight: 600; color: rgba(232,242,233,.8); } label span { color: rgba(232,242,233,.35); font-weight: 400; } input:not([type="hidden"]), textarea { margin-top:.5rem; width:100%; border:1px solid rgba(255,255,255,.12); border-radius:.75rem; background:rgba(0,0,0,.16); padding:.8rem 1rem; color:#e8f2e9; outline:none; transition:border-color .2s, box-shadow .2s; font-size:.875rem; } input:not([type="hidden"])::placeholder, textarea::placeholder { color:rgba(232,242,233,.3); } input:not([type="hidden"]):focus, textarea:focus { border-color:#6ee7b7; box-shadow:0 0 0 3px rgba(110,231,183,.1); } textarea { resize:vertical; }`}</style>
    </main>
  );
}
