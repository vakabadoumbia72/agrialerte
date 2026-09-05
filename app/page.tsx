"use client";

import { FormEvent, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";

const pollutionTypes = [
  "Eau trouble",
  "Sol décoloré",
  "Poissons morts",
  "Récolte abîmée",
  "Autre",
] as const;

const steps = [
  {
    number: "01",
    title: "Signalement citoyen",
    text: "Un constat simple depuis votre téléphone, avec votre position GPS et une photo si nécessaire.",
  },
  {
    number: "02",
    title: "Analyse IA par satellite",
    text: "Nos modèles croisent les alertes avec les images Sentinel pour repérer les zones à risque.",
  },
  {
    number: "03",
    title: "Intervention des autorités",
    text: "Les acteurs locaux reçoivent une information fiable pour agir rapidement sur le terrain.",
  },
];

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
      const photoFiles = formData
        .getAll("photos")
        .filter((value): value is File => value instanceof File && value.size > 0);
      const photoUrls = await Promise.all(
        photoFiles.map(async (file) => {
          const filePath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { error: uploadError } = await supabase.storage
            .from("signalements")
            .upload(filePath, file);

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage
            .from("signalements")
            .getPublicUrl(filePath);
          return data.publicUrl;
        }),
      );

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
    <main className="min-h-screen overflow-hidden bg-[#06110d] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="#" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-[#06110d]">
            ✦
          </span>
          <span>Agri<span className="text-emerald-400">Alerte</span></span>
        </a>
        <a href="#signaler" className="hidden rounded-full border border-emerald-400/30 px-5 py-2.5 text-sm text-emerald-300 transition hover:border-emerald-300 hover:bg-emerald-400/10 sm:block">
          Faire un signalement
        </a>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-32 lg:pt-20">
        <div className="relative z-10">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Côte d’Ivoire · Protection du vivant
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-7xl">
            Défendre nos terres, <span className="text-emerald-400">protéger notre avenir.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-emerald-100/65">
            AgriAlerte lutte contre l’orpaillage clandestin en Côte d’Ivoire : signalez, nous analysons par satellite et sauvons l’agriculture.
          </p>
          <a href="#signaler" className="mt-9 inline-flex items-center gap-3 rounded-full bg-emerald-400 px-6 py-3.5 font-semibold text-[#06110d] shadow-lg shadow-emerald-500/20 transition hover:-translate-y-1 hover:bg-emerald-300">
            Signaler une pollution <span aria-hidden>↗</span>
          </a>
          <div className="mt-12 flex gap-8 border-t border-white/10 pt-6 text-sm">
            <div><strong className="block text-2xl text-white">24/7</strong><span className="text-emerald-100/50">Veille citoyenne</span></div>
            <div><strong className="block text-2xl text-white">10 m</strong><span className="text-emerald-100/50">Précision satellite</span></div>
            <div><strong className="block text-2xl text-white">1 voix</strong><span className="text-emerald-100/50">peut tout changer</span></div>
          </div>
        </div>
        <div className="relative h-[480px] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-black/40 lg:h-[600px]">
          <img src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85" alt="Paysage naturel avec une rivière" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06110d] via-transparent to-emerald-950/10" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Alerte en cours</p>
            <p className="mt-1 text-sm text-white/80">Une communauté informée, un territoire mieux protégé.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#091a14] px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Simple. Rapide. Utile.</p><h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Comment ça marche</h2></div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((step) => <article key={step.number} className="group rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-2 hover:border-emerald-400/40 hover:bg-emerald-400/[0.06]"><span className="text-sm font-semibold text-emerald-400">{step.number}</span><h3 className="mt-16 text-xl font-semibold">{step.title}</h3><p className="mt-4 leading-7 text-emerald-100/55">{step.text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="signaler" className="bg-[#091a14] px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl"><div className="mb-10 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Votre témoignage compte</p><h2 className="mt-4 text-4xl font-semibold tracking-tight">Signaler une pollution</h2><p className="mt-4 text-emerald-100/55">Une minute pour protéger durablement votre environnement.</p></div>
          <form ref={formRef} onSubmit={submitReport} className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-10">
            <button type="button" onClick={useCurrentLocation} className="w-full rounded-xl border border-emerald-400/40 px-4 py-3.5 font-semibold text-emerald-300 transition hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-400">⌖ Utiliser ma position actuelle</button>
            {locationStatus && <p className="text-sm text-emerald-400" role="status">{locationStatus}</p>}
            <div><label htmlFor="nom_zone" className="mb-2 block text-sm font-medium text-emerald-100/80">Nom du lieu / village</label><input id="nom_zone" name="nom_zone" type="text" required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30" placeholder="Ex. Yamoussoukro, quartier..." /></div>
            <fieldset><legend className="mb-3 text-sm font-medium text-emerald-100/80">Type de pollution</legend><div className="grid gap-3 sm:grid-cols-2">{pollutionTypes.map((type) => <button key={type} type="button" aria-pressed={typePollution === type} onClick={() => setTypePollution(type)} className={`rounded-xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400 ${typePollution === type ? "border-emerald-400 bg-emerald-400/15 text-emerald-200" : "border-white/10 text-emerald-100/60 hover:border-emerald-400/50 hover:bg-white/[0.03]"}`}>{type}</button>)}</div></fieldset>
            <div><label htmlFor="description" className="mb-2 block text-sm font-medium text-emerald-100/80">Description</label><textarea id="description" name="description" required rows={5} placeholder="Décrivez ce que vous avez observé..." className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30" /></div>
            <div><label htmlFor="contact_signaleur" className="mb-2 block text-sm font-medium text-emerald-100/80">Téléphone <span className="text-white/30">(optionnel)</span></label><input id="contact_signaleur" name="contact_signaleur" type="tel" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30" placeholder="+225 00 00 00 00 00" /></div>
            <div><label htmlFor="photos" className="mb-2 block text-sm font-medium text-emerald-100/80">Photos <span className="text-white/30">(optionnel)</span></label><input id="photos" name="photos" type="file" accept="image/*" multiple className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none file:mr-4 file:rounded file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:font-semibold file:text-[#06110d] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30" /></div>
            <input type="hidden" name="latitude" value={latitude} readOnly /><input type="hidden" name="longitude" value={longitude} readOnly />
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-400 px-4 py-4 font-bold text-[#06110d] transition hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Envoi en cours..." : "Envoyer le signalement  ↗"}</button>
            {formStatus && <p className="text-center text-sm text-emerald-300" role="status">{formStatus}</p>}
          </form>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-emerald-100/35 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 AgriAlerte</span><span>Pour une Côte d’Ivoire fertile et résiliente.</span></footer>
    </main>
  );
}
