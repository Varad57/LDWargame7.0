import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  baseAlpha: number;
  hasFlare: boolean;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  alpha: number;
  maxAlpha: number;
  width: number;
  color: string;
  life: number;
  maxLife: number;
}

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };
    window.addEventListener("resize", handleResize);

    // Mouse parallax tracking
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Stellar color classification hues (O, B, A, F, G, K, M types)
    const starColors = [
      "rgba(255, 255, 255, ", // Pure White
      "rgba(160, 225, 255, ", // Cyan Blue (Rigel)
      "rgba(200, 235, 255, ", // Soft Ice Blue
      "rgba(255, 230, 180, ", // Golden Amber (Capella)
      "rgba(255, 200, 170, ", // Peach Red (Betelgeuse)
      "rgba(225, 180, 255, ", // Deep Violet / Cosmic Purple
    ];

    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];

    const initStars = () => {
      const starCount = Math.floor((width * height) / 1800); // Ultra-dense starfield
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const size = Math.random() * 1.9 + 0.4;
        const z = Math.random() * 3.2 + 0.5;
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          size,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          twinkleSpeed: Math.random() * 0.035 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          baseAlpha: Math.random() * 0.65 + 0.35,
          hasFlare: size > 1.6 && z < 1.1 && Math.random() > 0.6,
        });
      }
    };

    initStars();

    const spawnShootingStar = () => {
      if (Math.random() > 0.028 || shootingStars.length >= 4) return;
      const startX = Math.random() * width * 1.2 - width * 0.1;
      const startY = Math.random() * (height * 0.4);
      const angle = (Math.random() * 25 + 25) * (Math.PI / 180);
      const speed = Math.random() * 12 + 14;

      shootingStars.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: Math.random() * 140 + 90,
        speed,
        alpha: 0,
        maxAlpha: Math.random() * 0.8 + 0.2,
        width: Math.random() * 2.2 + 1,
        color: Math.random() > 0.5 ? "#00f0ff" : "#ff80df",
        life: 0,
        maxLife: Math.random() * 35 + 25,
      });
    };

    const render = () => {
      // Smooth mouse interpolation for 3D parallax
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;
      const offsetX = (mouseX - width / 2) * 0.035;
      const offsetY = (mouseY - height / 2) * 0.035;

      ctx.clearRect(0, 0, width, height);

      // Render starfield
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Slow ambient drift
        star.y -= 0.03 / star.z;
        if (star.y < 0) star.y = height;

        // Parallax offset based on depth z
        const px = (star.x + offsetX * (1 / star.z) + width) % width;
        const py = (star.y + offsetY * (1 / star.z) + height) % height;

        // Twinkle effect
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase) * 0.35 + 0.65;
        const alpha = Math.min(1, star.baseAlpha * twinkle);

        ctx.fillStyle = `${star.color}${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.size / star.z, 0, Math.PI * 2);
        ctx.fill();

        // Diffraction flare spikes (+) for bright foreground stars
        if (star.hasFlare && alpha > 0.4) {
          const flareLen = star.size * 5 * alpha;
          ctx.strokeStyle = `${star.color}${alpha * 0.4})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(px - flareLen, py);
          ctx.lineTo(px + flareLen, py);
          ctx.moveTo(px, py - flareLen);
          ctx.lineTo(px, py + flareLen);
          ctx.stroke();
        }

        // Glow halo for brighter stars
        if (star.size > 1.4 && star.z < 1.3) {
          ctx.fillStyle = `${star.color}${alpha * 0.28})`;
          ctx.beginPath();
          ctx.arc(px, py, star.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Handle shooting stars
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life++;
        s.x += s.dx;
        s.y += s.dy;

        if (s.life < s.maxLife * 0.25) {
          s.alpha = (s.life / (s.maxLife * 0.25)) * s.maxAlpha;
        } else {
          s.alpha = (1 - (s.life - s.maxLife * 0.25) / (s.maxLife * 0.75)) * s.maxAlpha;
        }

        const tailX = s.x - s.dx * (s.length / s.speed);
        const tailY = s.y - s.dy * (s.length / s.speed);

        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, s.color);
        grad.addColorStop(0.35, s.color);
        grad.addColorStop(1, "transparent");

        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Nucleus head
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.width * 1.3, 0, Math.PI * 2);
        ctx.fill();

        if (s.life >= s.maxLife || s.x > width + 200 || s.y > height + 200) {
          shootingStars.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Clean Dynamic Canvas Starfield & Shooting Stars */}
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full opacity-90" />
    </div>
  );
}
