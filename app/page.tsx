"use client";

import { FormEvent, useRef, useState } from "react";

const pollutionTypes = [
  "Eau trouble",
  "Sol décoloré",
  "Poissons morts",
  "Récolte abîmée",
  "Autre",
] as const;

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [typePollution, setTypePollution] = useState<string>("");
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
        }),
      });

      if (!response.ok) {
        throw new Error("Report submission failed");
      }

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
    <main className="min-h-screen bg-black px-4 py-10 text-green-400 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-green-500">
            AgriAlerte
          </p>
          <h1 className="text-3xl font-bold text-green-300 sm:text-4xl">
            Signaler une pollution
          </h1>
          <p className="mt-3 text-green-700">
            Aidez-nous à protéger votre environnement en partageant les informations
            observées sur le terrain.
          </p>
        </header>

        <form
          ref={formRef}
          onSubmit={submitReport}
          className="space-y-6 rounded-2xl border border-green-900 bg-zinc-950 p-6 shadow-2xl shadow-green-950/30 sm:p-8"
        >
          <button
            type="button"
            onClick={useCurrentLocation}
            className="w-full rounded-lg border border-green-600 px-4 py-3 font-semibold text-green-300 transition hover:bg-green-950 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Utiliser ma position actuelle
          </button>
          {locationStatus && (
            <p className="text-sm text-green-500" role="status">
              {locationStatus}
            </p>
          )}

          <div>
            <label htmlFor="nom_zone" className="mb-2 block font-medium">
              Nom du lieu/village
            </label>
            <input
              id="nom_zone"
              name="nom_zone"
              type="text"
              required
              className="w-full rounded-lg border border-green-900 bg-black px-4 py-3 text-green-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
            />
          </div>

          <fieldset>
            <legend className="mb-3 font-medium">Type de pollution</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {pollutionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={typePollution === type}
                  onClick={() => setTypePollution(type)}
                  className={`rounded-lg border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-green-400 ${
                    typePollution === type
                      ? "border-green-400 bg-green-900 text-green-100"
                      : "border-green-900 text-green-500 hover:border-green-600 hover:bg-green-950"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="description" className="mb-2 block font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              className="w-full resize-y rounded-lg border border-green-900 bg-black px-4 py-3 text-green-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
            />
          </div>

          <div>
            <label htmlFor="contact_signaleur" className="mb-2 block font-medium">
              Téléphone <span className="text-green-700">(optionnel)</span>
            </label>
            <input
              id="contact_signaleur"
              name="contact_signaleur"
              type="tel"
              className="w-full rounded-lg border border-green-900 bg-black px-4 py-3 text-green-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
            />
          </div>

          <input type="hidden" name="latitude" value={latitude} readOnly />
          <input type="hidden" name="longitude" value={longitude} readOnly />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-500 px-4 py-3 font-bold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Envoi en cours..." : "Envoyer le signalement"}
          </button>
          {formStatus && (
            <p className="text-center text-sm text-green-400" role="status">
              {formStatus}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
