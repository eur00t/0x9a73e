["load-script", "reset-css-canvas"];
async (loadScript) => {
  await loadScript("https://cdn.jsdelivr.net/npm/p5@1.3.1/lib/p5.js");

  let s1, s2;
  let gravity = 9.0;
  let mass = 2.0;

  const s = (p) => {
    p.setup = () => {
      p.createCanvas(window.innerWidth, window.innerHeight);
      p.fill(255, 126);
      // Inputs: x, y, mass, gravity
      s1 = new Spring2D(0.0, p.width / 2, mass, gravity);
      s2 = new Spring2D(0.0, p.width / 2, mass, gravity);
    };

    p.draw = () => {
      p.background(0);
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
        p.stroke(255);
        p.line(this.x, this.y, nx, ny);
      };
    }
  };

  new p5(s);
};
