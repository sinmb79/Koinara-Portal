import { useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"
import useStore from "../lib/store.js"
import { useT } from "../lib/i18n.js"
import { Button, Notice } from "../components/ui.jsx"
import AgentCard from "../components/AgentCard.jsx"
import { AGENT_CATEGORIES, loadMyAgentService, saveAgentService } from "../lib/agentCatalog.js"
import { requireMetaMaskProvider } from "../lib/wallet.js"

const EMPTY_FORM = {
  serviceName: "",
  description: "",
  category: "custom",
  models: "",
  basicPrice: "",
  basicDescription: "",
  standardPrice: "",
  standardDescription: "",
  premiumPrice: "",
  premiumDescription: "",
  gpu: "",
  ram: "",
  concurrent: "",
}

const inputClass =
  "h-11 w-full rounded-xl border border-primary/10 bg-[#10261f]/90 px-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"

export default function AgentServiceRegister() {
  const { address, lang, connect } = useStore()
  const t = useT(lang)
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!address) {
      setForm(EMPTY_FORM)
      return
    }
    const stored = loadMyAgentService(address)
    if (!stored) {
      setForm(EMPTY_FORM)
      return
    }
    setForm({
      serviceName: stored.serviceName || stored.name || "",
      description: stored.description || "",
      category: stored.category || "custom",
      models: Array.isArray(stored.models) ? stored.models.join(", ") : stored.models || "",
      basicPrice: stored.pricing?.basic?.price || "",
      basicDescription: stored.pricing?.basic?.description || "",
      standardPrice: stored.pricing?.standard?.price || "",
      standardDescription: stored.pricing?.standard?.description || "",
      premiumPrice: stored.pricing?.premium?.price || "",
      premiumDescription: stored.pricing?.premium?.description || "",
      gpu: stored.gpu || "",
      ram: stored.ram || "",
      concurrent: stored.concurrent || "",
    })
  }, [address])

  const previewAgent = useMemo(() => {
    const premium = Number.parseFloat(form.premiumPrice || "0") || 0
    return {
      address: address || "0x0000000000000000000000000000000000000000",
      name: form.serviceName || t("agent_register_preview_name"),
      category: form.category,
      icon: AGENT_CATEGORIES.find((item) => item.id === form.category)?.icon || "smart_toy",
      verified: false,
      online: true,
      models: form.models.split(",").map((item) => item.trim()).filter(Boolean),
      jobsCompleted: 0,
      bond: t("agent_register_preview_bond"),
      bondValue: 0,
      price: premium ? String(premium) : "0",
      rating: 5,
      ratingCount: 0,
      latency: "~2.0s",
    }
  }, [address, form, t])

  async function handlePublish(event) {
    event.preventDefault()
    if (!address) {
      try {
        await connect()
      } catch (error) {
        setStatus("error")
        setMessage(error.message)
      }
      return
    }

    setStatus("saving")
    setMessage("")

    try {
      const provider = new ethers.BrowserProvider(requireMetaMaskProvider())
      const signer = await provider.getSigner()
      const payload = {
        name: form.serviceName.trim(),
        serviceName: form.serviceName.trim(),
        description: form.description.trim(),
        category: form.category,
        models: form.models.split(",").map((item) => item.trim()).filter(Boolean),
        pricing: {
          basic: { price: form.basicPrice.trim(), description: form.basicDescription.trim() },
          standard: { price: form.standardPrice.trim(), description: form.standardDescription.trim() },
          premium: { price: form.premiumPrice.trim(), description: form.premiumDescription.trim() },
        },
        gpu: form.gpu.trim(),
        ram: form.ram.trim(),
        concurrent: form.concurrent.trim(),
      }
      const signature = await signer.signMessage(JSON.stringify(payload))
      await saveAgentService(address, { ...payload, signature })
      setStatus("success")
      setMessage(t("agent_register_saved"))
    } catch (error) {
      setStatus("error")
      setMessage(error.message || t("agent_register_error"))
    }
  }

  return (
    <div className="page-shell">
      <section className="space-y-4">
        <div className="inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t("agent_register_eyebrow")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{t("agent_register_title")}</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-400">{t("agent_register_subtitle")}</p>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handlePublish} className="space-y-6 rounded-3xl border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <section className="grid gap-5 md:grid-cols-2">
            <Field label={t("agent_register_service_name")}>
              <input value={form.serviceName} onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))} className={inputClass} />
            </Field>
            <Field label={t("agent_register_category")}>
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={inputClass}>
                {AGENT_CATEGORIES.filter((item) => item.id !== "all").map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("agent_register_models")} className="md:col-span-2">
              <input
                value={form.models}
                onChange={(event) => setForm((current) => ({ ...current, models: event.target.value }))}
                placeholder={t("agent_register_models_placeholder")}
                className={inputClass}
              />
            </Field>
            <Field label={t("agent_register_description")} className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={5}
                className={`${inputClass} min-h-[140px] resize-y py-3`}
              />
            </Field>
          </section>

          <section className="grid gap-5 rounded-3xl border border-white/5 bg-[#0b1713]/60 p-5 md:grid-cols-3">
            <TierField
              label={t("agent_tier_basic")}
              price={form.basicPrice}
              description={form.basicDescription}
              onPriceChange={(value) => setForm((current) => ({ ...current, basicPrice: value }))}
              onDescriptionChange={(value) => setForm((current) => ({ ...current, basicDescription: value }))}
            />
            <TierField
              label={t("agent_tier_standard")}
              price={form.standardPrice}
              description={form.standardDescription}
              onPriceChange={(value) => setForm((current) => ({ ...current, standardPrice: value }))}
              onDescriptionChange={(value) => setForm((current) => ({ ...current, standardDescription: value }))}
            />
            <TierField
              label={t("agent_tier_premium")}
              premium
              price={form.premiumPrice}
              description={form.premiumDescription}
              onPriceChange={(value) => setForm((current) => ({ ...current, premiumPrice: value }))}
              onDescriptionChange={(value) => setForm((current) => ({ ...current, premiumDescription: value }))}
            />
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            <Field label={t("agent_register_gpu")}>
              <input value={form.gpu} onChange={(event) => setForm((current) => ({ ...current, gpu: event.target.value }))} className={inputClass} />
            </Field>
            <Field label={t("agent_register_ram")}>
              <input value={form.ram} onChange={(event) => setForm((current) => ({ ...current, ram: event.target.value }))} className={inputClass} />
            </Field>
            <Field label={t("agent_register_concurrent")}>
              <input value={form.concurrent} onChange={(event) => setForm((current) => ({ ...current, concurrent: event.target.value }))} className={inputClass} />
            </Field>
          </section>

          <div className="space-y-4">
            <Notice>{t("agent_register_signature_note")}</Notice>
            {message ? <div className={`rounded-2xl border px-4 py-3 text-sm ${status === "success" ? "border-primary/20 bg-primary/10 text-primary" : "border-rose-400/20 bg-rose-400/10 text-rose-200"}`}>{message}</div> : null}
            <Button variant="primary" loading={status === "saving"}>
              {status === "saving" ? t("agent_register_saving") : t("agent_register_publish")}
            </Button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-primary/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t("agent_register_live_preview")}</div>
            <AgentCard agent={previewAgent} href={address ? `/agent/${address}` : "/agents"} ctaLabel={t("agent_card_hire")} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function TierField({ label, premium = false, price, description, onPriceChange, onDescriptionChange }) {
  return (
    <div className={`rounded-2xl border p-4 ${premium ? "border-primary/20 bg-primary/5" : "border-white/5 bg-white/5"}`}>
      <div className={`text-sm font-bold ${premium ? "text-primary" : "text-white"}`}>{label}</div>
      <div className="mt-3 space-y-3">
        <input value={price} onChange={(event) => onPriceChange(event.target.value)} placeholder="0 WLC" className={inputClass} />
        <input value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Description" className={inputClass} />
      </div>
    </div>
  )
}
