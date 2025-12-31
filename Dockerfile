FROM apify/actor-node-playwright-chrome:20

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm --quiet set progress=false \
    && npm install --only=prod --no-optional \
    && echo "Installed NPM packages:" \
    && (npm list --only=prod --no-optional --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && npx playwright install

# Copy source code
COPY . ./

# Run the actor
CMD npm start
