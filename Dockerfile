FROM node:20

# Install global packages
RUN npm install -g npm@latest && \ 
    npm install -g openapi-merge-cli && \ 
    npm install -g @redocly/cli@1.0.0-beta.129

# Set working directory
WORKDIR /files

# Copy template generator
COPY generate-html-template.js /files/

# Make scripts executable
RUN chmod +x /files/generate.sh