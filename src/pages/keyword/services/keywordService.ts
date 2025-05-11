import { KeywordGroup, Keyword, KeywordInput, KeywordResponse, KeywordFilter, PaginationParams, SortParams } from '../types';

// Supabase 클라이언트 가져오기
import { supabase } from '../../../supabase';

// 키워드 그룹 관련 서비스
export const keywordGroupService = {
  // 사용자의 모든 키워드 그룹 가져오기
  async getUserGroups(): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      const { data, error } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 불러오는 중 오류가 발생했습니다.',
      };
    }
  },

  // 새 키워드 그룹 생성
  async createGroup(name: string, isDefault: boolean = false): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 기본 그룹을 만들려고 할 때 이미 존재하는지 확인
      if (isDefault) {
        const { data: existingDefaultGroups, error: checkError } = await supabase
          .from('keyword_groups')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true);

        if (checkError) throw checkError;

        // 기본 그룹이 이미 있으면 그 그룹 반환
        if (existingDefaultGroups && existingDefaultGroups.length > 0) {
          return { success: true, data: existingDefaultGroups[0] };
        }
      }

      // 새 그룹 생성
      const { data, error } = await supabase
        .from('keyword_groups')
        .insert([
          { 
            user_id: user.id, 
            name, 
            is_default: isDefault 
          },
        ])
        .select();

      if (error) throw error;

      return { success: true, data: data[0] };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 생성하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 그룹 업데이트
  async updateGroup(groupId: number, name: string): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 그룹 소유권 확인
      const { data: groupData, error: checkError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 그룹 수정
      const { data, error } = await supabase
        .from('keyword_groups')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', groupId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      return { success: true, data: data[0] };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 업데이트하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 그룹 삭제
  async deleteGroup(groupId: number): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 기본 그룹인지 확인
      const { data: groupData, error: checkError } = await supabase
        .from('keyword_groups')
        .select('is_default')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      // 기본 그룹이면 삭제 불가
      if (groupData && groupData.is_default) {
        return {
          success: false,
          message: '기본 그룹은 삭제할 수 없습니다.',
        };
      }

      // 그룹에 속한 키워드도 삭제됨 (CASCADE 제약조건)
      const { error } = await supabase
        .from('keyword_groups')
        .delete()
        .eq('id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드 그룹을 삭제하는 중 오류가 발생했습니다.',
      };
    }
  },
};

// 키워드 관련 서비스
export const keywordService = {
  // 그룹의 모든 키워드 가져오기
  async getKeywordsByGroup(
    groupId: number,
    filter?: KeywordFilter,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 먼저 그룹이 현재 사용자의 것인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      let query = supabase
        .from('keywords')
        .select('*', { count: 'exact' });

      // 그룹 ID 필터
      query = query.eq('group_id', groupId);

      // 검색어 필터
      if (filter?.search) {
        query = query.or(
          `main_keyword.ilike.%${filter.search}%,keyword1.ilike.%${filter.search}%,keyword2.ilike.%${filter.search}%,keyword3.ilike.%${filter.search}%`
        );
      }

      // 활성 상태 필터
      if (filter?.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive);
      }

      // 정렬
      if (sort) {
        // 클라이언트에서는 스네이크 케이스로 직접 필드명을 넘겨주기로 했으니 그대로 사용
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // 페이지네이션
      if (pagination) {
        const { page, limit } = pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = data.map(item => ({
        id: item.id,
        groupId: item.group_id,
        mainKeyword: item.main_keyword,
        mid: item.mid,
        url: item.url,
        keyword1: item.keyword1,
        keyword2: item.keyword2,
        keyword3: item.keyword3,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return {
        success: true,
        data: {
          keywords: transformedData,
          total: count
        }
      };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 불러오는 중 오류가 발생했습니다.',
      };
    }
  },

  // 새 키워드 추가
  async createKeyword(
    groupId: number, 
    keywordData: KeywordInput
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      if (!groupId) {
        return {
          success: false,
          message: '키워드를 추가할 그룹을 선택해주세요.',
        };
      }

      // 사용자의 그룹인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      const { data, error } = await supabase
        .from('keywords')
        .insert([
          {
            group_id: groupId,
            main_keyword: keywordData.mainKeyword,
            mid: keywordData.mid,
            url: keywordData.url,
            keyword1: keywordData.keyword1,
            keyword2: keywordData.keyword2,
            keyword3: keywordData.keyword3,
            description: keywordData.description,
            is_active: keywordData.isActive !== undefined ? keywordData.isActive : true
          },
        ])
        .select();

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = {
        id: data[0].id,
        groupId: data[0].group_id,
        mainKeyword: data[0].main_keyword,
        mid: data[0].mid,
        url: data[0].url,
        keyword1: data[0].keyword1,
        keyword2: data[0].keyword2,
        keyword3: data[0].keyword3,
        description: data[0].description,
        isActive: data[0].is_active,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at
      };

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 생성하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 업데이트
  async updateKeyword(
    keywordId: number, 
    updateData: Partial<Keyword>
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 해당 키워드가 사용자의 그룹에 속해 있는지 확인
      const { data: keywordData, error: keywordError } = await supabase
        .from('keywords')
        .select('keywords.*, keyword_groups!inner(*)')
        .eq('keywords.id', keywordId)
        .eq('keyword_groups.user_id', user.id)
        .single();

      if (keywordError) {
        return {
          success: false,
          message: '해당 키워드에 접근할 권한이 없습니다.',
        };
      }

      // 스네이크 케이스로 변환
      const snakeCaseData: any = {};
      
      if (updateData.mainKeyword !== undefined) snakeCaseData.main_keyword = updateData.mainKeyword;
      if (updateData.mid !== undefined) snakeCaseData.mid = updateData.mid;
      if (updateData.url !== undefined) snakeCaseData.url = updateData.url;
      if (updateData.keyword1 !== undefined) snakeCaseData.keyword1 = updateData.keyword1;
      if (updateData.keyword2 !== undefined) snakeCaseData.keyword2 = updateData.keyword2;
      if (updateData.keyword3 !== undefined) snakeCaseData.keyword3 = updateData.keyword3;
      if (updateData.description !== undefined) snakeCaseData.description = updateData.description;
      if (updateData.isActive !== undefined) snakeCaseData.is_active = updateData.isActive;
      
      snakeCaseData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('keywords')
        .update(snakeCaseData)
        .eq('id', keywordId)
        .select();

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = {
        id: data[0].id,
        groupId: data[0].group_id,
        mainKeyword: data[0].main_keyword,
        mid: data[0].mid,
        url: data[0].url,
        keyword1: data[0].keyword1,
        keyword2: data[0].keyword2,
        keyword3: data[0].keyword3,
        description: data[0].description,
        isActive: data[0].is_active,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at
      };

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 업데이트하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 삭제
  async deleteKeyword(keywordId: number): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      // 해당 키워드가 사용자의 그룹에 속해 있는지 확인
      const { data: keywordData, error: keywordError } = await supabase
        .from('keywords')
        .select('keywords.*, keyword_groups!inner(*)')
        .eq('keywords.id', keywordId)
        .eq('keyword_groups.user_id', user.id)
        .single();

      if (keywordError) {
        return {
          success: false,
          message: '해당 키워드에 접근할 권한이 없습니다.',
        };
      }

      const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', keywordId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 삭제하는 중 오류가 발생했습니다.',
      };
    }
  },

  // 키워드 대량 추가
  async bulkCreateKeywords(
    groupId: number, 
    keywordsData: KeywordInput[]
  ): Promise<KeywordResponse> {
    try {
      // 현재 로그인한 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: false,
          message: '로그인이 필요합니다.',
        };
      }

      if (!groupId) {
        return {
          success: false,
          message: '키워드를 추가할 그룹을 선택해주세요.',
        };
      }

      // 사용자의 그룹인지 확인
      const { data: groupData, error: groupError } = await supabase
        .from('keyword_groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', user.id)
        .single();

      if (groupError) {
        return {
          success: false,
          message: '해당 그룹에 접근할 권한이 없습니다.',
        };
      }

      if (keywordsData.length === 0) {
        return {
          success: false,
          message: '추가할 키워드가 없습니다.',
        };
      }

      const keywordsToInsert = keywordsData.map(kw => ({
        group_id: groupId,
        main_keyword: kw.mainKeyword,
        mid: kw.mid,
        url: kw.url,
        keyword1: kw.keyword1,
        keyword2: kw.keyword2,
        keyword3: kw.keyword3,
        description: kw.description,
        is_active: kw.isActive !== undefined ? kw.isActive : true
      }));

      const { data, error } = await supabase
        .from('keywords')
        .insert(keywordsToInsert)
        .select();

      if (error) throw error;

      // 스네이크 케이스에서 카멜 케이스로 데이터 변환
      const transformedData = data.map(item => ({
        id: item.id,
        groupId: item.group_id,
        mainKeyword: item.main_keyword,
        mid: item.mid,
        url: item.url,
        keyword1: item.keyword1,
        keyword2: item.keyword2,
        keyword3: item.keyword3,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      
      return {
        success: false,
        message: '키워드를 대량 추가하는 중 오류가 발생했습니다.',
      };
    }
  }
};