"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ContactButton from "./ContactButton";
import * as Icons from "lucide-react";
import type { Producer } from "./ProducersList";
import Link from "next/link";

function stringToHsl(str: string, s = 65, l = 85) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h} ${s}% ${l}%)`;
}

interface ProducerModalProps {
  producer: Producer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProducerModal({
  producer,
  open,
  onOpenChange,
}: ProducerModalProps) {
  if (!producer) return null;

  const accent = stringToHsl(producer.id);
  const initials = producer.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {producer.avatar ? (
              <img
                src={producer.avatar}
                alt={producer.name}
                className="h-16 w-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="grid h-16 w-16 place-items-center rounded-full text-xl font-semibold flex-shrink-0"
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-2xl font-bold">
                  {producer.name}
                </DialogTitle>
                {producer.verified && (
                  <Icons.CheckCircle className="h-5 w-5 text-primary" aria-label="Verified" />
                )}
              </div>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icons.MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>{producer.location}</span>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Rating and Tags */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1.5">
              <Icons.Star
                className="h-4 w-4 text-yellow-500"
                aria-hidden="true"
              />
              <span className="font-medium">{producer.rating.toFixed(1)}</span>
              {producer.reviewsCount !== undefined && producer.reviewsCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({producer.reviewsCount} reviews)
                </span>
              )}
            </div>
            <Badge variant="secondary" className="px-3 py-1.5">
              {producer.category}
            </Badge>
            {producer.featured && (
              <Badge variant="default" className="px-3 py-1.5">
                Featured
              </Badge>
            )}
            {producer.trustScore !== undefined && producer.trustScore > 0 && (
              <Badge variant="outline" className="px-3 py-1.5">
                Trust Score: {producer.trustScore}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {producer.productsCount !== undefined && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Icons.Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{producer.productsCount}</div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </div>
              </div>
            )}
            {producer.reviewsCount !== undefined && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Icons.Star className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{producer.reviewsCount}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {producer.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {producer.description}
              </p>
            </div>
          )}

          {/* Services/Industry */}
          {(producer.services && producer.services.length > 0) || producer.industry ? (
            <div>
              <h3 className="font-semibold mb-2">Services & Industry</h3>
              <div className="flex flex-wrap gap-2">
                {producer.industry && (
                  <Badge variant="outline">{producer.industry}</Badge>
                )}
                {producer.services?.map((service, idx) => (
                  <Badge key={idx} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* Contact Information */}
          {(producer.website || producer.phone) && (
            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <div className="space-y-2">
                {producer.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icons.Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={producer.website.startsWith("http") ? producer.website : `https://${producer.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {producer.website}
                    </a>
                  </div>
                )}
                {producer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icons.Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{producer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t gap-3">
            {producer.userId && (
              <Link href={`/profile?user=${producer.userId}`}>
                <Button variant="outline" className="flex-1">
                  <Icons.User className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
              </Link>
            )}
            <ContactButton
              producerId={producer.id}
              producerName={producer.name}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

