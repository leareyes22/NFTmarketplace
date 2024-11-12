// src/app/discover/solana/products/[assetId]/page.tsx

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import Image from "next/image";
import Link from "next/link";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import {
  buyNFT,
  fetchSolUsdPrice,
  getNFTDetail,
  getNFTList,
  RemoveNFTList,
  SolanaTokens,
} from "@/utils/nftMarket";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDownIcon, CaretUpIcon } from "@radix-ui/react-icons";

interface Product {
  name: string;
  imageURI: string;
  groupAddress: string;
  seller: string;
  price: string;
  listing: string;
}

const ProductPage: React.FC = () => {
  const { assetId } = useParams() as { assetId: string };
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [price, setPrice] = useState<number>(0);
  const [token, setToken] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [solPrice, setSolPrice] = useState<number>(0);

  useEffect(() => {
    const fetchSolPrice = async () => {
      const solUsdPrice = await fetchSolUsdPrice();
      setSolPrice(solUsdPrice);
    };

    fetchSolPrice();
  }, []);

  useEffect(() => {
    if (assetId) {
      const fetchProductDetails = async () => {
        try {
          const provider = new AnchorProvider(connection, wallet as Wallet, {});

          const listings = await getNFTList(provider, connection);
          const listing = listings.find((list) => list.mint == assetId);
          const details = await getNFTDetail(
            new PublicKey(assetId),
            connection,
            listing?.seller,
            listing?.price,
            listing?.pubkey || ""
          );
          setProduct({
            name: details.name,
            imageURI: details.image || "",
            groupAddress: details.group || "",
            seller: details.seller,
            price: details.price,
            listing: details.listing,
          });
          setMainImage(details.image || "");
        } catch (error) {
          console.error("Error fetching product details:", error);
        }
      };

      fetchProductDetails();
    }
  }, [assetId]);

  useEffect(() => {
    if (token) {
      const priceInSol = Number(product?.price) / LAMPORTS_PER_SOL;

      if (token.includes("USD")) {
        setPrice(priceInSol * solPrice);
        return;
      }

      setPrice(priceInSol);
    }
  }, [token]);

  const onBuy = useCallback(
    async (sellerkey: string, listingkey: string, token: string) => {
      if (!publicKey) {
        console.error("Connect the wallet");
        alert("Connect the Wallet!");
        return;
      }

      const provider = new AnchorProvider(connection, wallet as Wallet, {});

      const mint = new PublicKey(assetId);

      const nftAccount = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const seller = new PublicKey(sellerkey);
      const listing = new PublicKey(listingkey);

      console.log("NFT associated account", nftAccount.toBase58());
      try {
        await buyNFT(
          mint,
          seller,
          listing,
          publicKey,
          provider,
          sendTransaction,
          connection,
          token
        );
      } catch (error) {
        console.log(error);
      }
    },
    [publicKey, connection, sendTransaction]
  );

  const onWithdraw = useCallback(
    async (listingkey: string) => {
      if (!publicKey) {
        console.error("Connect the wallet");
        alert("Connect the Wallet!");
        return;
      }

      const provider = new AnchorProvider(connection, wallet as Wallet, {});

      const listing = new PublicKey(listingkey);
      const mint = new PublicKey(assetId);
      try {
        await RemoveNFTList(publicKey, mint, listing, provider, connection);
        router.back();
      } catch (err) {
        console.log(err);
      }
    },
    [publicKey, connection, sendTransaction, price]
  );

  const setSelectedToken = (e: Event) => {
    const target = e.target as HTMLDivElement;
    setToken(target.textContent ?? "USDC");
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-black p-4">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[500px] w-[500px] rounded-xl dark:bg-gray-800" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px] dark:bg-gray-800" />
            <Skeleton className="h-4 w-[200px] dark:bg-gray-800" />
            <Skeleton className="h-4 w-[300px] dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black p-4">
      <Card className="flex flex-col items-center p-8 border rounded-lg shadow-lg bg-white dark:bg-gray-900 dark:border-gray-700 w-full max-w-2xl">
        <button
          className="self-start mb-4 text-blue-500 hover:underline"
          onClick={() => router.back()}
        >
          Back to market
        </button>
        <div className="w-full flex flex-col items-center">
          {mainImage && (
            <Image
              src={mainImage}
              alt={product.name}
              width={400}
              height={400}
              className="object-contain rounded-lg mb-4"
              loading="lazy"
            />
          )}
          <h1 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            {product.name}
          </h1>
          <p className="text-md text-gray-800 dark:text-gray-200">
            <strong>Group Address:</strong>
            <Link
              href={`https://solscan.io/address/${product.groupAddress}`}
              target="_blank"
              className="text-blue-500 hover:underline ml-2"
            >
              {product.groupAddress}
            </Link>
          </p>
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger className="mt-2 mb-2 p-1 w-auto flex justify-between items-center rounded-xl outline outline-gray-400 hover:outline-gray-950">
              {token === "" ? "Select Token" : token}
              {isDropdownOpen ? <CaretUpIcon /> : <CaretDownIcon />}
            </DropdownMenuTrigger>
            <DropdownMenuContent color="gray">
              {Object.keys(SolanaTokens).length
                ? Object.keys(SolanaTokens).map((k) => {
                    return (
                      <DropdownMenuItem
                        key={SolanaTokens[k].address}
                        onSelect={setSelectedToken}
                      >
                        {k}
                      </DropdownMenuItem>
                    );
                  })
                : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="text-md text-gray-800 dark:text-gray-200">
            <strong>{price ? `Price: ${price} ${token}` : ""}</strong>
          </div>
          {product.seller == publicKey?.toString() ? (
            <Button
              className="w-full h-12 text-xl bg-blue-400 text-white hover:bg-blue-500 mt-6"
              onClick={() => onWithdraw(product.listing)}
            >
              Withdraw
            </Button>
          ) : (
            <Button
              className="w-full h-12 text-xl bg-blue-400 text-white hover:bg-blue-500 mt-6"
              onClick={() => onBuy(product.seller, product.listing, token)}
              disabled={!token}
            >
              Buy
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductPage;
