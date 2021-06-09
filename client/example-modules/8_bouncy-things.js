`A demo of gravitation springs in p5.js`;
true;
["load-script", "get-seed-color-hsl", "reset-css-canvas"];
(loadScript, getSeedColorHSL) => {
  return async (seed) => {
    if (seed === "0x00") {
      seed =
        "0x9791C3C4B47334C07EABEE766DE66C00758E05FD0B17683675692452E05E4F96";
    }

    await loadScript("https://cdn.jsdelivr.net/npm/p5@1.3.1/lib/p5.js");

    let s1, s2;
    let gravity = 9.0;
    let mass = 2.0;

    const s = (p) => {
      const [h, s, l] = getSeedColorHSL(seed);

      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.fill(l > 50 ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)");
        // Inputs: x, y, mass, gravity
        s1 = new Spring2D(0.0, p.width / 2, mass, gravity);
        s2 = new Spring2D(0.0, p.width / 2, mass, gravity);
      };

      p.draw = () => {
        p.background(`hsl(${h}, ${s}%, ${l}%)`);
        s1.update(p.mouseX, p.mouseY);
        s1.display(p.mouseX, p.mouseY);
        s2.update(s1.x, s1.y);
        s2.display(s1.x, s1.y);
      };

      function Spring2D(xpos, ypos, m, g) {
        this.x = xpos; // The x- and y-coordinates
        this.y = ypos;
        this.vx = 0; // The x- and y-axis velocities
        this.vy = 0;
        this.mass = m;
        this.gravity = g;
        this.radius = 30;
        this.stiffness = 0.2;
        this.damping = 0.7;

        this.update = function (targetX, targetY) {
          let forceX = (targetX - this.x) * this.stiffness;
          let ax = forceX / this.mass;
          this.vx = this.damping * (this.vx + ax);
          this.x += this.vx;
          let forceY = (targetY - this.y) * this.stiffness;
          forceY += this.gravity;
          let ay = forceY / this.mass;
          this.vy = this.damping * (this.vy + ay);
          this.y += this.vy;
        };

        this.display = function (nx, ny) {
          p.noStroke();
          p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
          p.stroke(l > 50 ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)");
          p.line(this.x, this.y, nx, ny);
        };
      }
    };

    new p5(s);
  };
};
