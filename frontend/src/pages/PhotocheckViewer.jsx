import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as THREE from 'three';
import logoUrl from '../assets/logo.png';
import firmaUrl from '../assets/firma.png';
import { proxyImageUrl } from '../services/api';
import './PhotocheckViewer.css';

const API_URL = import.meta.env.VITE_API_URL;

const CARD_W = 720;
const CARD_H = 1140;
const CORNER_R = 28;

const COLORS = {
  primary: '#3a6fa0',
  primaryDark: '#1a3a5a',
  primaryLight: '#5a9fd4',
  accent: '#c9a85a',
  text: '#1a2a40',
  textMuted: '#6b7a99',
  bg: '#f5f3ec',
};

const INST = {
  nameLine1: 'Universidad Nacional',
  nameLine2: 'del Altiplano',
  shortName: 'UNA',
  location: 'Puno',
  rrhhPhone: '(051) 363-282',
  rrhhEmail: 'rrhh@unap.edu.pe',
  legalText: 'Este carnet es personal e intransferible. Su uso está limitado a las instalaciones y actividades oficiales de la universidad. En caso de pérdida o robo, comuníquese de inmediato con la Oficina de Recursos Humanos para su reposición y desactivación. El uso indebido será sancionado conforme al reglamento interno.',
  lostText: 'Reportar pérdida al teléfono (051) 363-282 o al correo rrhh@unap.edu.pe',
};

function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

function drawWatermark(ctx, logo, w, h) {
  if (!logo) return;
  const side = Math.min(w, h) * 0.78;
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.drawImage(logo, (w - side) / 2, (h - side) / 2, side, side);
  ctx.restore();
}

function drawLogoMark(ctx, x, y, size, logoImg) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, size, size, size * 0.15);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, size, size, size * 0.15);
  ctx.stroke();
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const pad = size * 0.08;
    ctx.drawImage(logoImg, x + pad, y + pad, size - pad * 2, size - pad * 2);
  } else {
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.primary;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${size * 0.5}px "Playfair Display", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('U', x + size / 2, y + size / 2 + size * 0.02);
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.42, 0, Math.PI * 2);
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = COLORS.accent;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhotoPlaceholder(ctx, x, y, w, h, name) {
  const palette = ['#1a4a7a', '#7a1a4a', '#4a7a1a', '#7a4a1a', '#1a7a4a', '#4a1a7a', '#2a5a8a'];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % palette.length;
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  ctx.save();
  roundRect(ctx, x, y, w, h, 16);
  ctx.clip();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, palette[idx]);
  grad.addColorStop(1, '#0f1a30');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y + h * 0.3, w * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.8, y + h * 0.75, w * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(h * 0.45)}px "Montserrat", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, x + w / 2, y + h / 2 + h * 0.02);
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, 16);
  ctx.strokeStyle = 'rgba(15,26,48,0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawPhoto(ctx, x, y, w, h, persona) {
  if (persona.photoImg) {
    ctx.save();
    roundRect(ctx, x, y, w, h, 16);
    ctx.clip();
    const ir = persona.photoImg.width / persona.photoImg.height;
    const tr = w / h;
    let sx, sy, sw, sh;
    if (ir > tr) { sh = persona.photoImg.height; sw = sh * tr; sx = (persona.photoImg.width - sw) / 2; sy = 0; }
    else { sw = persona.photoImg.width; sh = sw / tr; sx = 0; sy = (persona.photoImg.height - sh) / 2; }
    ctx.drawImage(persona.photoImg, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, w, h, 16);
    ctx.strokeStyle = 'rgba(15,26,48,0.18)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  } else {
    drawPhotoPlaceholder(ctx, x, y, w, h, persona.nombre);
  }
}

function drawCardBorder(ctx, w, h, isFront) {
  const outerInset = 20, innerInset = 32;
  const cR = CORNER_R - 8, icR = CORNER_R - 14;
  ctx.save();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2.2;
  roundRect(ctx, outerInset, outerInset, w - outerInset * 2, h - outerInset * 2, cR);
  ctx.stroke();
  ctx.strokeStyle = isFront ? 'rgba(201,168,90,0.45)' : 'rgba(26,42,74,0.28)';
  ctx.lineWidth = 0.8;
  roundRect(ctx, innerInset, innerInset, w - innerInset * 2, h - innerInset * 2, icR);
  ctx.stroke();
  const cSize = 5, cOff = outerInset + 10;
  const corners = [{ x: cOff, y: cOff }, { x: w - cOff, y: cOff }, { x: w - cOff, y: h - cOff }, { x: cOff, y: h - cOff }];
  for (const c of corners) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.moveTo(0, -cSize);
    ctx.lineTo(cSize, 0);
    ctx.lineTo(0, cSize);
    ctx.lineTo(-cSize, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isFront ? 'rgba(201,168,90,0.55)' : 'rgba(26,42,74,0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const decoY = h - 62;
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 1;
  const dL = innerInset + 20, dR = w - innerInset - 20, dM = w / 2;
  ctx.beginPath();
  ctx.moveTo(dL, decoY); ctx.lineTo(dM - 16, decoY);
  ctx.moveTo(dM + 16, decoY); ctx.lineTo(dR, decoY);
  ctx.stroke();
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.moveTo(dM, decoY - 4); ctx.lineTo(dM + 4, decoY); ctx.lineTo(dM, decoY + 4); ctx.lineTo(dM - 4, decoY);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function wrapText(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && current) { lines.push(current); current = word; }
    else current = test;
  }
  if (current) lines.push(current);
  return lines;
}

function drawFrontCard(ctx, persona) {
  const w = CARD_W, h = CARD_H;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, COLORS.primary); bg.addColorStop(0.55, COLORS.primary); bg.addColorStop(1, COLORS.primaryDark);
  ctx.fillStyle = bg; roundRect(ctx, 0, 0, w, h, CORNER_R); ctx.fill();
  drawWatermark(ctx, persona.logoImg, w, h);
  ctx.save(); ctx.beginPath(); roundRect(ctx, 0, 0, w, h, CORNER_R); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, 0, w, h); ctx.restore();
  const headerH = 140;
  ctx.save(); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, headerH);
  ctx.fillStyle = COLORS.accent; ctx.fillRect(0, headerH - 5, w, 5); ctx.restore();
  drawLogoMark(ctx, 40, 28, 88, persona.logoImg);
  ctx.save(); ctx.fillStyle = COLORS.primary; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = '700 30px "Playfair Display", serif';
  ctx.fillText(INST.nameLine1, 150, 56); ctx.fillText(INST.nameLine2, 150, 92);
  ctx.font = '600 16px "Montserrat", sans-serif'; ctx.fillStyle = COLORS.primaryLight;
  ctx.fillText(`FOTOCHECK INSTITUCIONAL · ${INST.shortName}`, 150, 120); ctx.restore();
  drawCardBorder(ctx, w, h, true);
  const photoW = 360, photoH = 440, photoX = (w - photoW) / 2, photoY = headerH + 50;
  drawPhoto(ctx, photoX, photoY, photoW, photoH, persona);
  const infoY = photoY + photoH + 40;
  ctx.save(); ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accent; ctx.fillRect(w / 2 - 30, infoY, 60, 3);
  const maxNameW = w - 100;
  let nameSize = 36;
  ctx.font = `800 ${nameSize}px "Montserrat", sans-serif`;
  while (ctx.measureText(persona.nombre).width > maxNameW && nameSize > 20) {
    nameSize -= 2;
    ctx.font = `800 ${nameSize}px "Montserrat", sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(persona.nombre, w / 2, infoY + 38);
  ctx.fillStyle = '#cfe0ff'; ctx.font = '600 22px "Montserrat", sans-serif';
  ctx.fillText(persona.cargo, w / 2, infoY + 78);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '500 18px "Montserrat", sans-serif';
  ctx.fillText(persona.area, w / 2, infoY + 110); ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '500 14px "Montserrat", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Válido únicamente con firma y sello institucional', w / 2, h - 78); ctx.restore();
}

function drawBackCard(ctx, persona) {
  const w = CARD_W, h = CARD_H;
  ctx.fillStyle = '#ffffff'; roundRect(ctx, 0, 0, w, h, CORNER_R); ctx.fill();
  const headerH = 140;
  ctx.save(); ctx.fillStyle = COLORS.primary; ctx.fillRect(0, 0, w, headerH);
  ctx.fillStyle = COLORS.accent; ctx.fillRect(0, headerH - 5, w, 5); ctx.restore();
  drawLogoMark(ctx, 40, 28, 88, persona.logoImg);
  ctx.save(); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = '700 30px "Playfair Display", serif';
  ctx.fillText(INST.nameLine1, 150, 56); ctx.fillText(INST.nameLine2, 150, 92);
  ctx.font = '600 16px "Montserrat", sans-serif'; ctx.fillStyle = COLORS.accent;
  ctx.fillText(`INFORMACION DEL SERVIDOR · ${INST.location.toUpperCase()}`, 150, 120); ctx.restore();
  drawCardBorder(ctx, w, h, false);

  let curY = headerH + 40;

  ctx.save(); ctx.fillStyle = COLORS.primary; ctx.fillRect(40, curY, 6, 30);
  ctx.font = '800 20px "Montserrat", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('DATOS PERSONALES', 60, curY + 15);
  ctx.fillStyle = COLORS.text; ctx.font = '500 18px "Montserrat", sans-serif'; ctx.textBaseline = 'top';
  ctx.fillText(`DNI: ${persona.dni || '---'}`, 50, curY + 48);
  ctx.fillText(`Cargo: ${persona.cargo || '---'}`, 50, curY + 78);
  ctx.fillText(`Area: ${persona.area || '---'}`, 50, curY + 108);
  ctx.restore();
  curY += 150;

  ctx.save(); ctx.fillStyle = '#e8e4dc'; ctx.fillRect(40, curY, w - 80, 1); ctx.restore();
  curY += 20;

  ctx.save(); ctx.fillStyle = COLORS.primary; ctx.fillRect(40, curY, 6, 30);
  ctx.font = '800 20px "Montserrat", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('CONTACTO', 60, curY + 15);
  ctx.fillStyle = COLORS.text; ctx.font = '500 18px "Montserrat", sans-serif'; ctx.textBaseline = 'top';
  ctx.fillText(`Correo: ${persona.correo || '---'}`, 50, curY + 48);
  ctx.fillText(`Telefono: ${(persona.telefono || '---').replace(/^51/, '')}`, 50, curY + 78);
  ctx.restore();
  curY += 118;

  ctx.save(); ctx.fillStyle = '#e8e4dc'; ctx.fillRect(40, curY, w - 80, 1); ctx.restore();
  curY += 20;

  ctx.save(); ctx.fillStyle = COLORS.primary; ctx.fillRect(40, curY, 6, 30);
  ctx.font = '800 20px "Montserrat", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('INFORMACION EXTRA', 60, curY + 15);
  ctx.fillStyle = COLORS.text; ctx.font = '500 17px "Montserrat", sans-serif'; ctx.textBaseline = 'top';
  const extraLines = wrapText(ctx, INST.legalText, w - 100);
  let ty = curY + 48;
  for (const line of extraLines) { ctx.fillText(line, 50, ty); ty += 26; }
  ctx.restore();
  curY = ty + 20;

  ctx.save(); ctx.fillStyle = '#e8e4dc'; ctx.fillRect(40, curY, w - 80, 1); ctx.restore();
  curY += 20;

  const footerH = 70;
  const firmaBlockH = 200;
  const firmaY = h - footerH - firmaBlockH;
  const firmaW = 360, firmaH = 140;
  const firmaX = (w - firmaW) / 2;

  if (persona.firmaImg && persona.firmaImg.complete && persona.firmaImg.naturalWidth > 0) {
    ctx.save();
    const ratio = persona.firmaImg.width / persona.firmaImg.height;
    let sx, sy, sw, sh;
    if (ratio > firmaW / firmaH) { sh = persona.firmaImg.height; sw = sh * (firmaW / firmaH); sx = (persona.firmaImg.width - sw) / 2; sy = 0; }
    else { sw = persona.firmaImg.width; sh = sw / (firmaW / firmaH); sx = 0; sy = (persona.firmaImg.height - sh) / 2; }
    ctx.drawImage(persona.firmaImg, sx, sy, sw, sh, firmaX, firmaY, firmaW, firmaH);
    ctx.restore();
  } else {
    ctx.save(); ctx.strokeStyle = COLORS.primary; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    const base = firmaY + firmaH * 0.65;
    ctx.moveTo(firmaX, base);
    ctx.bezierCurveTo(firmaX + firmaW * 0.15, firmaY + firmaH * 0.2, firmaX + firmaW * 0.3, firmaY + firmaH * 0.9, firmaX + firmaW * 0.45, firmaY + firmaH * 0.35);
    ctx.bezierCurveTo(firmaX + firmaW * 0.55, firmaY + firmaH * 0.05, firmaX + firmaW * 0.7, firmaY + firmaH * 0.7, firmaX + firmaW * 0.85, firmaY + firmaH * 0.4);
    ctx.stroke();
    ctx.restore();
  }
  const lineaY = firmaY + firmaH + 6;
  const lineaW = firmaW + 40;
  const lineaX = (w - lineaW) / 2;
  ctx.strokeStyle = COLORS.textMuted; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(lineaX, lineaY); ctx.lineTo(lineaX + lineaW, lineaY); ctx.stroke();
  ctx.fillStyle = COLORS.textMuted; ctx.font = '600 18px "Montserrat", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('FIRMA AUTORIZADA', w / 2, lineaY + 8);

  ctx.save(); ctx.fillStyle = COLORS.primary; ctx.fillRect(0, h - footerH, w, footerH);
  ctx.fillStyle = COLORS.accent; ctx.fillRect(0, h - footerH, w, 4);
  ctx.fillStyle = '#ffffff'; ctx.font = '500 14px "Montserrat", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(INST.lostText, w / 2, h - footerH / 2);
  ctx.restore();
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function initScene(frontCanvas, backCanvas, container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a3050);
  scene.fog = new THREE.Fog(0x1a3050, 14, 38);
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, -0.3, 11);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  scene.add(new THREE.HemisphereLight(0xb0c8ff, 0x2a4a6a, 0.75));
  [
    { c: 0xffffff, i: 0.75, p: [6, 8, 9] }, { c: 0x8aa6ff, i: 0.45, p: [-7, -3, 6] },
    { c: 0xffffff, i: 0.75, p: [-6, 8, -9] }, { c: 0xffd58a, i: 0.45, p: [7, -3, -6] },
  ].forEach(cfg => { const l = new THREE.DirectionalLight(cfg.c, cfg.i); l.position.set(...cfg.p); scene.add(l); });
  const pF = new THREE.PointLight(0xffffff, 0.9, 28); pF.position.set(0, -0.3, 12.2); scene.add(pF);
  const pB = new THREE.PointLight(0xffffff, 0.45, 22); pB.position.set(0, 0.5, -7); scene.add(pB);
  const fGeo = new THREE.PlaneGeometry(60, 60);
  const fMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5a, roughness: 0.35, metalness: 0.55 });
  const fl = new THREE.Mesh(fGeo, fMat); fl.rotation.x = -Math.PI / 2; fl.position.y = -4.5; scene.add(fl);
  const gr = new THREE.GridHelper(60, 60, 0x5a8ab5, 0x2a5070); gr.position.y = -4.49; gr.material.transparent = true; gr.material.opacity = 0.35; scene.add(gr);
  const wGeo = new THREE.PlaneGeometry(70, 36);
  const wC = document.createElement('canvas'); wC.width = 1024; wC.height = 512;
  const wX = wC.getContext('2d'); wX.fillStyle = '#1a3a5a'; wX.fillRect(0, 0, 1024, 512);
  const g1 = wX.createRadialGradient(512, 256, 0, 512, 256, 520);
  g1.addColorStop(0, 'rgba(90,159,212,0.55)'); g1.addColorStop(0.25, 'rgba(201,168,90,0.18)'); g1.addColorStop(0.6, 'rgba(60,100,150,0.08)'); g1.addColorStop(1, 'rgba(26,48,80,0)');
  wX.fillStyle = g1; wX.fillRect(0, 0, 1024, 512);
  const g2 = wX.createRadialGradient(180, 180, 0, 180, 180, 280); g2.addColorStop(0, 'rgba(139,92,246,0.25)'); g2.addColorStop(1, 'rgba(139,92,246,0)'); wX.fillStyle = g2; wX.fillRect(0, 0, 1024, 512);
  const g3 = wX.createRadialGradient(860, 360, 0, 860, 360, 300); g3.addColorStop(0, 'rgba(16,185,129,0.22)'); g3.addColorStop(1, 'rgba(16,185,129,0)'); wX.fillStyle = g3; wX.fillRect(0, 0, 1024, 512);
  const wTex = new THREE.CanvasTexture(wC); wTex.colorSpace = THREE.SRGBColorSpace;
  const wMat = new THREE.MeshBasicMaterial({ map: wTex, color: 0x2a5a80, transparent: true, opacity: 0.92 });
  const wMesh = new THREE.Mesh(wGeo, wMat); wMesh.position.set(0, 4, -16); scene.add(wMesh);
  [
    { c: 0x4a7bd6, i: 1.4, p: [-5, 3, -9] }, { c: 0xc9a85a, i: 1.2, p: [5, -2, -10] },
    { c: 0x8b5cf6, i: 0.9, p: [0, 5, -13] }, { c: 0x10b981, i: 0.7, p: [-3, -3, -11] },
  ].forEach(cfg => { const l = new THREE.PointLight(cfg.c, cfg.i, 28); l.position.set(...cfg.p); scene.add(l); });
  const pc = 700, pPos = new Float32Array(pc * 3), pCol = new Float32Array(pc * 3), pSz = new Float32Array(pc);
  const cA = new THREE.Color(0xc9a85a), cB = new THREE.Color(0xf5e6c8), cC = new THREE.Color(0xffe8a0);
  for (let i = 0; i < pc; i++) {
    const r = 6 + Math.random() * 22, th = Math.random() * Math.PI * 2, ph = (Math.random() - 0.5) * Math.PI;
    pPos[i * 3] = Math.cos(th) * Math.cos(ph) * r; pPos[i * 3 + 1] = Math.sin(ph) * r * 0.7; pPos[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r - 4;
    const t = Math.random(); const c = t < 0.6 ? cA : t < 0.85 ? cB : cC;
    pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b; pSz[i] = 0.04 + Math.random() * 0.12;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSz, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float size; varying vec3 vColor; uniform float uTime; void main(){vColor=color;vec3 p=position;p.y+=sin(uTime*0.3+position.x*0.5)*0.15;p.x+=cos(uTime*0.2+position.z*0.3)*0.1;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=size*(320.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying vec3 vColor; void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.0,d);gl_FragColor=vec4(vColor,a*0.85);}`,
  });
  const pts = new THREE.Points(pGeo, pMat); scene.add(pts);
  const shapes = [], aGeos = [], aMats = [];
  function mkMat(color, opts = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.55, metalness: opts.metalness ?? 0.1, emissive: opts.emissive ?? color, emissiveIntensity: opts.eI ?? 0.15, transparent: true, opacity: opts.opacity ?? 0.85 });
    aMats.push(m); return m;
  }
  function mkCap() {
    const g = new THREE.Group();
    const cM = mkMat(0x3a6fa0, { roughness: 0.6, opacity: 0.9 }), tM = mkMat(0xc9a85a, { metalness: 0.5, eI: 0.35, opacity: 0.95 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.55), cM); b.position.y = 0.16; g.add(b); aGeos.push(b.geometry);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 20), cM); c.position.y = 0.04; g.add(c); aGeos.push(c.geometry);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), tM); btn.position.y = 0.19; g.add(btn); aGeos.push(btn.geometry);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), tM); st.position.set(0, 0.06, 0.27); st.rotation.x = 0.25; g.add(st); aGeos.push(st.geometry);
    const en = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.005, 0.08, 6), tM); en.position.set(0.03, -0.04, 0.32); en.rotation.x = 0.25; g.add(en); aGeos.push(en.geometry);
    return g;
  }
  function mkDiploma() {
    const g = new THREE.Group();
    const pM = mkMat(0xf5f0e0, { roughness: 0.75, metalness: 0.02, eI: 0.05, opacity: 0.92 });
    const rM = mkMat(0x8b1a2a, { roughness: 0.6, eI: 0.1, opacity: 0.9 });
    const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 16), pM); rl.rotation.z = Math.PI / 2; g.add(rl); aGeos.push(rl.geometry);
    const e1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.035, 16), rM); e1.rotation.z = Math.PI / 2; e1.position.x = 0.35; g.add(e1); aGeos.push(e1.geometry);
    const e2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.035, 16), rM); e2.rotation.z = Math.PI / 2; e2.position.x = -0.35; g.add(e2); aGeos.push(e2.geometry);
    const rb = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.02, 6, 16), rM); rb.rotation.y = Math.PI / 2; rb.position.x = 0.35; g.add(rb); aGeos.push(rb.geometry);
    return g;
  }
  function mkStar() {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 === 0 ? 0.24 : 0.095;
      if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 2 });
    aGeos.push(geo);
    return new THREE.Mesh(geo, mkMat(0xc9a85a, { roughness: 0.25, metalness: 0.55, eI: 0.4, opacity: 0.95 }));
  }
  const plan = ['cap', 'cap', 'diploma', 'diploma', 'star', 'star', 'star', 'star', 'star'];
  for (let i = 0; i < plan.length; i++) {
    const m = plan[i] === 'cap' ? mkCap() : plan[i] === 'diploma' ? mkDiploma() : mkStar();
    const a = (i / plan.length) * Math.PI * 2 + Math.random() * 0.3, d = 7.5 + Math.random() * 4;
    m.position.set(Math.cos(a) * d, (Math.random() - 0.5) * 4.5, -3 - Math.random() * 7);
    if (plan[i] === 'star') { const dir = new THREE.Vector3(0, 0, 0).sub(m.position).normalize(); m.lookAt(m.position.clone().add(dir)); }
    m.userData = { rA: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), rS: 0.15 + Math.random() * 0.35, bY: m.position.y, fO: Math.random() * Math.PI * 2, fS: 0.3 + Math.random() * 0.4 };
    scene.add(m); shapes.push(m);
  }
  const fTex = new THREE.CanvasTexture(frontCanvas), bTex = new THREE.CanvasTexture(backCanvas);
  fTex.colorSpace = bTex.colorSpace = THREE.SRGBColorSpace;
  fTex.anisotropy = bTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  fTex.needsUpdate = bTex.needsUpdate = true;
  bTex.center.set(0.5, 0.5); bTex.repeat.set(-1, 1); bTex.needsUpdate = true;
  const sMat = new THREE.MeshStandardMaterial({ color: 0x5a9fd4, roughness: 0.5, metalness: 0.1, emissive: 0x5a9fd4, emissiveIntensity: 0.55 });
  const eMat = new THREE.MeshStandardMaterial({ color: 0x7ab5e0, roughness: 0.4, metalness: 0.2, emissive: 0x7ab5e0, emissiveIntensity: 0.6 });
  const frMat = new THREE.MeshStandardMaterial({ map: fTex, emissive: 0xffffff, emissiveMap: fTex, emissiveIntensity: 0.22, roughness: 0.5, metalness: 0.05 });
  const bkMat = new THREE.MeshStandardMaterial({ map: bTex, emissive: 0xffffff, emissiveMap: bTex, emissiveIntensity: 0.22, roughness: 0.5, metalness: 0.05 });
  const cW = 3.6, cH = 5.7, cD = 0.06;
  const geo = new THREE.BoxGeometry(cW, cH, cD);
  const uv = geo.attributes.uv;
  for (let i = 20; i < 24; i++) uv.setX(i, 1 - uv.getX(i));
  uv.needsUpdate = true;
  const card = new THREE.Mesh(geo, [eMat, eMat, sMat, sMat, frMat, bkMat]);
  scene.add(card);
  const shGeo = new THREE.PlaneGeometry(cW * 1.4, cH * 0.6);
  const shMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
  const sh = new THREE.Mesh(shGeo, shMat); sh.rotation.x = -Math.PI / 2; sh.position.y = -4.48; scene.add(sh);
  const cv = renderer.domElement;
  let dragging = false, lX = 0, lY = 0, autoR = true, resTm = null, aPtr = null;
  function pauseA() { autoR = false; if (resTm) { clearTimeout(resTm); resTm = null; } }
  function schedR() { if (resTm) clearTimeout(resTm); resTm = setTimeout(() => { autoR = true; resTm = null; }, 600); }
  function onDn(e) { if (e.button !== 0) return; dragging = true; aPtr = e.pointerId; lX = e.clientX; lY = e.clientY; pauseA(); try { cv.setPointerCapture(e.pointerId); } catch (err) { void err; } }
  function onMv(e) { if (!dragging || e.pointerId !== aPtr) return; card.rotation.y += (e.clientX - lX) * 0.012; lX = e.clientX; lY = e.clientY; }
  function onUp(e) { if (e.pointerId !== aPtr && aPtr !== null) return; dragging = false; aPtr = null; try { cv.releasePointerCapture(e.pointerId); } catch (err) { void err; } schedR(); }
  function onWh(e) { e.preventDefault(); camera.position.z = Math.max(7, Math.min(16, camera.position.z + e.deltaY * 0.012)); }
  cv.addEventListener('pointerdown', onDn); cv.addEventListener('pointermove', onMv);
  cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('wheel', onWh, { passive: false });
  function onRes() { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); }
  window.addEventListener('resize', onRes);
  const clock = new THREE.Clock();
  let fId;
  function anim() {
    fId = requestAnimationFrame(anim);
    const t = clock.getElapsedTime();
    pMat.uniforms.uTime.value = t;
    for (const s of shapes) { const d = s.userData; s.rotateOnAxis(d.rA, d.rS * 0.012); s.position.y = d.bY + Math.sin(t * d.fS + d.fO) * 0.35; }
    pts.rotation.y = t * 0.02;
    if (autoR && !dragging) card.rotation.y += 0.0048;
    card.rotation.x = 0;
    card.rotation.z = 0;
    renderer.render(scene, camera);
  }
  anim();
  return {
    dispose() {
      cancelAnimationFrame(fId);
      if (resTm) clearTimeout(resTm);
      window.removeEventListener('resize', onRes);
      cv.removeEventListener('pointerdown', onDn); cv.removeEventListener('pointermove', onMv);
      cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
      cv.removeEventListener('wheel', onWh);
      [geo, fGeo, fMat, gr.geometry, gr.material, wGeo, wMat, pGeo, pMat, ...aGeos, ...aMats, sMat, eMat, frMat, bkMat, shGeo, shMat, fTex, bTex].forEach(x => x.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}

export default function PhotocheckViewer() {
  const { codigo } = useParams();
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dni, setDni] = useState('');
  const [canisters, setCanisters] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/fotocheck/${codigo}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Fotocheck no encontrado');
        const data = await res.json();
        if (cancelled) return;
        const t = data.trabajador;
        const logoImg = await loadImage(logoUrl);
        const firmaImg = await loadImage(firmaUrl);
        const photoImg = await loadImage(proxyImageUrl(t.foto));
        const persona = { dni: t.dni, nombre: t.nombre_completo || `${t.nombres} ${t.apellidos}`, cargo: t.cargo || '', area: t.area || t.empresa || '', correo: t.correo || '', telefono: t.telefono || '', photoImg, logoImg, firmaImg };
        const fC = document.createElement('canvas'); fC.width = CARD_W; fC.height = CARD_H;
        drawFrontCard(fC.getContext('2d'), persona);
        const bC = document.createElement('canvas'); bC.width = CARD_W; bC.height = CARD_H;
        drawBackCard(bC.getContext('2d'), persona);
        if (!cancelled) { setDni(t.dni); setCanisters({ fC, bC }); setLoading(false); }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [codigo]);

  useEffect(() => {
    if (!canisters || !stageRef.current) return;
    if (sceneRef.current) sceneRef.current.dispose();
    sceneRef.current = initScene(canisters.fC, canisters.bC, stageRef.current);
    return () => { if (sceneRef.current) { sceneRef.current.dispose(); sceneRef.current = null; } };
  }, [canisters]);

  if (loading && !error) {
    return (
      <div className="viewer-container">
        <div className="overlay">
          <div className="spinner" />
          <p>Cargando fotocheck…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viewer-container">
        <div className="overlay">
          <div className="error-card">
            <h2>No se encontró el fotocheck</h2>
            <p>{error}</p>
            <p className="hint">Verifica el enlace o contacta a Recursos Humanos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-container">
      <div id="stage" ref={stageRef} />
      <div className="info-bar">
        <span className="hint-rotate">Arrastra para rotar · Se devuelve solo</span>
      </div>
    </div>
  );
}
