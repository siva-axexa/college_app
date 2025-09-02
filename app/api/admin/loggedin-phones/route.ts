import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication middleware here
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let phones: any[] = [];
    let totalCount = 0;

    if (search.trim()) {
      const searchTerm = search.trim();
      // Since frontend only allows numbers, we know search is always numeric
      const searchNumber = parseInt(searchTerm);
      
      // Priority 1: Search by User ID (exact match)
      const { data: idMatchData, error: idError } = await supabase
        .from('Student')
        .select('id, phoneNumber, created_at')
        .eq('signedUp', false)
        .eq('isVerifiedUser', true)
        .not('phoneNumber', 'is', null)
        .eq('id', searchNumber);

      if (idError) {
        console.error('Search error:', idError);
        // Don't throw error, just return empty results
        phones = [];
        totalCount = 0;
      } else if (idMatchData && idMatchData.length > 0) {
        // Found exact ID match
        phones = idMatchData;
        totalCount = idMatchData.length;
      } else {
        // Priority 2: Search by phone number (substring match)
        const { data: allData, error: allError } = await supabase
          .from('Student')
          .select('id, phoneNumber, created_at')
          .eq('signedUp', false)
          .eq('isVerifiedUser', true)
          .not('phoneNumber', 'is', null)
          .order('created_at', { ascending: false });

        if (allError) {
          console.error('Phone search error:', allError);
          // Don't throw error, just return empty results
          phones = [];
          totalCount = 0;
        } else if (allData) {
          // Filter by phone number substring
          const filteredPhones = allData.filter(phone => 
            phone.phoneNumber.toString().includes(searchTerm)
          );
          
          // Apply pagination to filtered results
          phones = filteredPhones.slice(offset, offset + limit);
          totalCount = filteredPhones.length;
        } else {
          phones = [];
          totalCount = 0;
        }
      }
    } else {
      // No search term - fetch all with pagination
      const { data, error, count } = await supabase
        .from('Student')
        .select('id, phoneNumber, created_at', { count: 'exact' })
        .eq('signedUp', false)
        .eq('isVerifiedUser', true)
        .not('phoneNumber', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Database error:', error);
        // Don't throw error, just return empty results
        phones = [];
        totalCount = 0;
      } else {
        phones = data || [];
        totalCount = count || 0;
      }
    }

    // Format the response
    const formattedPhones = phones.map(phone => ({
      id: phone.id,
      phoneNumber: phone.phoneNumber.toString(),
      createdAt: phone.created_at,
      userId: phone.id
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        data: formattedPhones,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
      },
      { status: 500 }
    );
  }
}