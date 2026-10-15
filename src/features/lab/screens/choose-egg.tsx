"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { EggArt } from "../art/egg";
import { CreatureImage } from "../art/creature-image";
import { EGGS, FAMILY_LABEL, type EggId } from "../creatures";
import { DEFAULT_NAME, INITIAL_STATE, sanitizeName, STYLES, type ExplorerStyle } from "../state";
import { BottomActions, ChoiceCard, DemoNote, LAB, LabTopBar } from "../ui";
import { useHydrated, useLabState } from "../use-lab-state";

const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} '’.-]*$/u;

export function ChooseEggScreen() {
  const hydrated = useHydrated();
  // Le formulaire reprend les choix précédents de la démonstration, lus dans le stockage local
  return hydrated ? <ChooseEggForm /> : <main className="min-h-full" />;
}

function ChooseEggForm() {
  const { state, replace } = useLabState();
  const router = useRouter();
  const [name, setName] = useState(state.name === DEFAULT_NAME ? "" : state.name);
  const [style, setStyle] = useState<ExplorerStyle | null>(state.style);
  const [egg, setEgg] = useState<EggId>(state.egg);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = sanitizeName(name);
    if (clean && !NAME_RE.test(clean)) {
      setError("Utilise des lettres, des chiffres, des espaces ou des tirets.");
      document.getElementById("lab-name")?.focus();
      return;
    }
    // Nouveau départ de la démonstration : progression remise à zéro, rien n'est envoyé
    replace({ ...INITIAL_STATE, name: clean || DEFAULT_NAME, style, egg });
    router.push(`${LAB}/location-choice`);
  };

  return (
    <main className="flex min-h-full flex-col">
      <LabTopBar back={`${LAB}/onboarding/5`} title="Ton profil d'explorateur" />
      <form onSubmit={submit} className="lab-fade-up flex flex-1 flex-col" noValidate>
        <div className="space-y-7 px-5 pt-2">
          <div>
            <label htmlFor="lab-name" className="lab-serif block text-2xl font-bold text-[var(--lab-forest-deep)]">
              Comment veux-tu qu&apos;on t&apos;appelle ?
            </label>
            <input
              id="lab-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={24}
              autoComplete="nickname"
              placeholder="Prénom ou pseudo"
              aria-invalid={error ? true : undefined}
              aria-describedby="lab-name-hint"
              className="mt-3 h-14 w-full rounded-[20px] border-2 border-[rgba(31,90,61,0.18)] bg-[var(--lab-paper)] px-4 text-lg font-semibold placeholder:font-normal placeholder:text-[#8a958d] focus:border-[var(--lab-forest)] focus:outline-none"
            />
            <p id="lab-name-hint" className={error ? "mt-1.5 text-sm font-semibold text-[#9a3b26]" : "mt-1.5 text-sm text-[var(--lab-ink-soft)]"}>
              {error ?? `Facultatif — sinon, on t'appellera « ${DEFAULT_NAME} ».`}
            </p>
          </div>

          <fieldset>
            <legend className="lab-serif text-2xl font-bold text-[var(--lab-forest-deep)]">Quel est ton style d&apos;exploration ?</legend>
            <p className="mt-1 text-sm text-[var(--lab-ink-soft)]">Facultatif, modifiable plus tard.</p>
            <div className="mt-3 grid gap-2">
              {STYLES.map((s) => (
                <ChoiceCard key={s.id} name="style" value={s.id} checked={style === s.id} onChange={(v) => setStyle(v as ExplorerStyle)} label={s.label} hint={s.hint} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="lab-serif text-2xl font-bold text-[var(--lab-forest-deep)]">Quel œuf veux-tu accompagner ?</legend>
            <div className="mt-3 grid gap-2.5">
              {EGGS.map((e) => (
                <ChoiceCard
                  key={e.id}
                  name="egg"
                  value={e.id}
                  checked={egg === e.id}
                  onChange={(v) => setEgg(v as EggId)}
                  label={e.label}
                  hint={`${e.biome}. ${e.clue} Compagnon : famille ${FAMILY_LABEL[e.hatches]}.`}
                  visual={
                    <span className="relative flex shrink-0 items-end">
                      <EggArt egg={e.id} nest={false} className="h-20 w-16" />
                      {/* Qui sommeille dans l'œuf : silhouette seulement, la surprise reste pour l'éclosion */}
                      <CreatureImage id={e.hatches} silhouette className="-ml-3 h-12" alt="" sizes="48px" />
                    </span>
                  }
                />
              ))}
            </div>
          </fieldset>

          <DemoNote>
            Tes choix restent dans cette démonstration locale.
            <br />
            Aucun compte réel n&apos;est créé. Aucune position n&apos;est demandée.
          </DemoNote>
        </div>
        <BottomActions>
          <button type="submit" className="lab-btn lab-btn-primary">
            Choisir ma première aventure
          </button>
        </BottomActions>
      </form>
    </main>
  );
}
