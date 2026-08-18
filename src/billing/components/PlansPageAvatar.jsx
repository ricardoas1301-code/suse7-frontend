import planosPageAvatar from "../../assets/profile/planos-page-avatar.png";

export default function PlansPageAvatar() {
  return (
    <figure className="s7-billing-plans-page-avatar" aria-hidden="false">
      <img
        src={planosPageAvatar}
        alt="Ilustração de especialista SUSE7 apresentando recursos completos da plataforma"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}
